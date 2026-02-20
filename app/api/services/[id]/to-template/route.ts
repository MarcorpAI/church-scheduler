import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { templateName } = await request.json();

        // Fetch original service and its items
        const originalService = await prisma.service.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!originalService) {
            return NextResponse.json({ message: "Service not found" }, { status: 404 });
        }

        // Create a new template service
        const template = await prisma.service.create({
            data: {
                name: templateName || `${originalService.name} (Template)`,
                description: originalService.description,
                date: new Date(), // Templates still need a date but it's not used when cloning
                is_template: true,
                church_id: originalService.church_id,
                created_by: session.user.id,
            }
        });

        // Copy items to the template
        if (originalService.items.length > 0) {
            await prisma.programItem.createMany({
                data: originalService.items.map(item => ({
                    title: item.title,
                    description: item.description,
                    duration: item.duration,
                    order: item.order,
                    service_id: template.id,
                    department_id: item.department_id,
                }))
            });
        }

        return NextResponse.json(template, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ message }, { status: 500 });
    }
}
