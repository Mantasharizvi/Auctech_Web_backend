// npm run seed  → creates the admin user and the website cards
import "dotenv/config";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.modal.js";
import Website from "../models/Website.modal.js";

await connectDB();

const email = process.env.ADMIN_EMAIL.toLowerCase();
if (!(await User.findOne({ email }))) {
  await User.create({
    name: "Admin", email, company: "AUCTECH MARCOM", role: "Admin", status: "approved",
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
  });
  console.log("✅ Admin created:", email);
}

if (!(await Website.countDocuments())) {
  const w = (name, domain, url, logo, logoBg, description) => ({ name, domain, url, logo, logoBg, description });
  await Website.insertMany([
    w("ARV Vastu Interiors", "arvvastuinteriors.com", "https://arvvastuinteriors.com/", "https://arvvastuinteriors.com/images/header-newest-logo.png", "white", "Interior design, architecture and Vastu consultancy based in Lucknow."),
    w("Auctech Marcom Canada", "auctech.ca", "https://auctech.ca/", "https://auctech.ca/assets/images/logo-light.png", "dark", "AI-powered digital agency in Ottawa for websites, automation and marketing."),
    w("JB General Exports LLP", "jbge.co.in", "https://jbge.co.in/", "https://jbge.co.in/images/home/logo-gold.png", "dark", "Import and export company sourcing cloves, rice, almonds and more."),
    w("PartyHub Connect", "partyhubconnect.com", "https://www.partyhubconnect.com/", "https://www.partyhubconnect.com/assets/partyhub-logo.png", "white", "Ontario's event marketplace to compare and book verified vendors."),
    w("St. Xavier's Convent School", "stxaviersconvent.org", "https://stxaviersconvent.org/", "", "white", "English-medium co-educational school in Gomti Nagar, Lucknow."),
    w("MSME Promotion Council of India", "msmepci.org", "https://msmepci.org/", "https://msmepci.org/wp-content/uploads/2025/05/MSMEPCI-LOGO.png", "white", "Supports MSMEs with schemes, banking access and skill development."),
    w("Ashwood International Collegiate", "ashwoodinternationalcollegiate.ca", "https://ashwoodinternationalcollegiate.ca/", "", "white", "Ontario Ministry-approved Canadian OSSD high school programme."),
    w("SBTech", "sbtech.ca", "https://sbtech.ca/", "https://sbtech.ca/assets/images/logo-light.png", "white", "Enterprise cybersecurity, AI automation and managed IT services."),
    w("WestPills", "westpills.com", "https://www.westpills.com/", "https://www.westpills.com/westpills.png", "white", "Prescription medicine information and inquiry platform."),
    w("Holy Vision International", "holyvisioninternational.org", "https://www.holyvisioninternational.org/", "https://www.holyvisioninternational.org/assets/images/site/uploads/2026/02/HVI-removebg-preview.png", "white", "Peace, education and youth empowerment organisation."),
  ].map((x, i) => ({ ...x, order: i })));
  console.log("✅ Websites seeded");
}


process.exit(0);