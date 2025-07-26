import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    console.log("Received contact form submission:", { name, email, subject });

    // Get admin email settings
    const { data: emailSettings, error: settingsError } = await supabaseClient
      .from("admin_email_settings")
      .select("setting_value")
      .eq("setting_key", "contact_notification_emails")
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching email settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch email settings" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const adminEmails = emailSettings?.setting_value 
      ? emailSettings.setting_value.split(",").map(email => email.trim())
      : ["admin@pickleballhub.com"]; // fallback email

    console.log("Sending notification to admin emails:", adminEmails);

    // Send email to admins
    const emailResponse = await resend.emails.send({
      from: "Contact Form <noreply@resend.dev>",
      to: adminEmails,
      subject: `New Contact Form Submission: ${subject || "No Subject"}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || "No subject provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>This message was sent via the Pickleball Hub contact form.</em></p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);