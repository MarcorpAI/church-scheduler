import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // Find services happening tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const upcomingServices = await prisma.service.findMany({
            where: {
                date: {
                    gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
                    lt: new Date(dayAfter.setHours(0, 0, 0, 0)),
                },
            },
            include: {
                tasks: {
                    include: {
                        assignee: true,
                    },
                },
            },
        });

        for (const service of upcomingServices) {
            for (const task of service.tasks) {
                if (task.assignee?.email) {
                    await sendEmail({
                        to: task.assignee.email,
                        subject: `Reminder: ${task.title} for ${service.name} tomorrow`,
                        text: `Hi ${task.assignee.name}, just a reminder that you are assigned to "${task.title}" for tomorrow's service: ${service.name}.`,
                    });
                }
            }
        }

        return NextResponse.json({ success: true, processed: upcomingServices.length });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
