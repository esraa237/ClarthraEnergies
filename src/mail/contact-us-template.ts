import { generateEmailTemplate } from './email-template';

export function contactUsTemplate({
    fullName,
    organization,
    email,
    areaOfInterest,
    representation,
    message,
}: {
    fullName: string;
    organization: string;
    email: string;
    areaOfInterest: string;
    representation: string;
    message: string;
}) {
    return generateEmailTemplate({
        title: `New Contact Form Submission`,
        greeting: `Hello Admin,`,
        message: `
      You have received a new contact form submission.<br><br>
      <strong>Full Name:</strong> ${fullName}<br>
      <strong>Organization:</strong> ${organization}<br>
      <strong>Email:</strong> ${email}<br>
      <strong>Area of Interest:</strong> ${areaOfInterest}<br>
      <strong>Representation:</strong> ${representation}<br><br>
      <strong>Message:</strong><br>
      ${message}
    `,
        warning: 'Please review and respond if necessary.',
        companyName: process.env.COMPANY_NAME || '',
        logoUrl: process.env.COMPANY_LOGO_URL || '',
        supportEmail: process.env.COMPANY_SUPPORT_EMAIL || '',
    });
}
