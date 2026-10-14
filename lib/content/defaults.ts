import { defaultGalleryCategoryDescriptions } from "./gallery-description-defaults"
import type { SiteContent } from "./types"

export const defaultSiteContent: SiteContent = {
  branding: {
    brandName: "Evelyn Joshua",
    brandInitial: "Pst.",
  },
  header: {
    aboutDropdownItems: [
      { label: "Evelyn Joshua Biography", href: "/about/pst-evelyn-joshua" },
      { label: "TB Joshua Biography", href: "/about/tb-joshua" },
      { label: "Emmanuel TV", href: "/about/emmanuel-tv" },
      { label: "The SCOAN", href: "/about/scoan" },
    ],
    navItems: [
      { label: "Home", href: "/" },
      { label: "Crusade/Outreach", href: "/gallery" },
      { label: "Sermon", href: "/Sermon" },
      { label: "Blog", href: "/blog" },
      { label: "Visit", href: "/visit" },
    ],
  },
  footer: {
    tagline: "Serving the world with faith, love, and spiritual guidance.",
    quickLinks: [
      { label: "About", href: "/about/pst-evelyn-joshua" },
      { label: "Crusade/Outreach", href: "/gallery" },
      { label: "Sermon", href: "/Sermon" },
      { label: "Contact", href: "/contact" },
    ],
    email: "info@scoan.org",
    phone: "+234 (0) 8068220995",
    address:
      "The Synagogue, Church Of All Nations Headquarters is located at: 1, Prophet T.B Joshua Street, Ikotun-Egbe, Lagos, Nigeria",
    socialLinks: {
      facebook: "https://www.facebook.com/scoan",
      instagram: "https://www.instagram.com/scoan",
      youtube: "https://www.youtube.com/scoan",
      email: "mailto:info@scoan.org",
    },
    copyright: "SCOAN & Emmanuel TV. All rights reserved.",
  },
  home: {
    hero: {
      title: "Good Morning,",
      phrases: ["And Win Today", "Win Tomorrow", "And Win Forever"],
      backgroundVideoUrl:
        "https://res.cloudinary.com/dvlcc2r5w/video/upload/v1771257266/HEADER_2026_HD_jltk79.mp4",
      carouselImages: [
        { publicId: "10_cdpaih", alt: "Slide visual" },
        { publicId: "1A_1_luhi2h", alt: "Slide visual" },
        { publicId: "C_8_gcmkxe", alt: "Slide visual" },
      ],
      buttons: [
        { label: "Visit SCOAN", href: "https://www.scoan.org/", variant: "primary" },
        { label: "Visit Emmanuel TV", href: "https://emmanuel.tv/", variant: "secondary" },
      ],
    },
    about: {
      title: "About",
      highlightText: "Pastor Evelyn Joshua",
      content:
        "Pastor Evelyn Joshua is a Nigerian minister of God, pastor, preacher and tele-evangelist. She is the Senior Pastor and Leader of world renowned charismatic Christian ministry, The Synagogue, Church of All Nations (The SCOAN). Evelyn is also the President of Emmanuel Global Network (Owner of Emmanuel TV).",
      learnMoreHref: "/about/pst-evelyn-joshua",
      carouselImages: [
        { publicId: "1A_40_ime6ny", alt: "Pastor Evelyn Joshua" },
        { publicId: "E_4_retutw", alt: "Pastor Evelyn Joshua Ministry" },
        { publicId: "1A_40_ime6ny", alt: "Pastor Evelyn Joshua Service" },
      ],
    },
    sermon: {
      badge: "Latest Sermon",
      title: "EMMANUEL TV - 20 YEARS OF GOD'S GLORY",
      date: "March 08, 2026",
      speaker: "Pastor Evelyn Joshua Sermon",
      summaryParagraphs: [
        "In her address during The Emmanuel TV 20th Anniversary, Pastor Evelyn Joshua gives a message on love, faith and standing firm during trials.",
        "Reading from James 1:2-8, The SCOAN Leader enjoins us to persevere in faith, love and the rendering of service to fellow humans - in the manner taught by Prophet TB Joshua via the example of Emmanuel TV.",
      ],
      quote:
        '"Your faith will not grow until you are placed in a situation that requires more than you have ever had." - Pastor Evelyn Joshua.',
      keyTopics: ["Trust in God", "Faith", "Perseverance", "Joyful Life"],
      featuredImageUrl:
        "https://res.cloudinary.com/dvlcc2r5w/image/upload/v1773053310/EMMANUEL_TV_-_20_YEARS_OF_GOD_S_GLORY_-_Pastor_Evelyn_Joshua_Sermon_Landscape_co6hnh.png",
      facebookVideoEmbedUrl:
        "https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1429301158950052%2F&show_text=false&width=560&t=0",
      watchNowUrl:
        "https://www.stream.emmanuel.tv/title/conquering-with-faith-and-love-%7C-pastor-evelyn-joshua-sermon/en?id=69adfbcde4b064133a2afdd4&type=vod&isFromTabLayout=true",
      watchNowLabel: "Watch Now",
      downloadAppUrl: "https://emmanuel.tv/download/",
      downloadAppLabel: "Download App",
    },
    newsletter: {
      title: "Stay Connected with Our",
      titleHighlight: "Ministry",
      description: "Subscribe to receive updates on events, teachings, and Special Programs.",
    },
  },
  contact: {
    title: "Get In",
    titleHighlight: "Touch",
    subtitle: "Have questions or want to learn more about our ministry? We'd love to hear from you.",
    email: "info@scoan.org",
    phone: "+234 (0) 8068220995",
    location:
      "The Synagogue, Church Of All Nations Headquarters is located at: 1, Prophet T.B Joshua Street, Ikotun-Egbe, Lagos, Nigeria",
  },
  visit: {
    heroTitle: "Visit The SCOAN",
    heroSubtitle:
      "Experience the presence of God at The Synagogue, Church Of All Nations. We welcome you to join us for worship, prayer, and fellowship.",
    gallerySectionTitle: "Church Gallery",
  },
  gallery: {
    label: "Gallery",
    title: "Crusade & Outreach",
    subtitle:
      "Witness the impact of our ministry through powerful images and moments captured during our crusades and community outreach programs.",
    categoryDescriptions: defaultGalleryCategoryDescriptions,
    categorySubcategories: {},
    subcategoryDescriptions: {},
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "System",
}
