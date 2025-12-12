import { Facebook, Instagram, Youtube, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/70 rounded-lg flex items-center justify-center mb-4">
              <span className="text-primary font-bold text-lg">Pst.</span>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Serving the world with faith, love, and spiritual guidance.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-accent">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {["About", "Crusade/Outreach", "Sermon", "Blog"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-primary-foreground/70 hover:text-accent transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-accent">Contact</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>Email: info@scoan.org</li>
              <li>Phone: +234 (0) 8068220995</li>
              <li>The Synagogue, Church Of All Nations Headquarters is located at: 1, Prophet T.B Joshua Street, Ikotun-Egbe, Lagos, Nigeria</li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="font-semibold mb-4 text-accent">Follow Us</h3>
            <div className="flex gap-4">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Instagram, label: "Instagram" },
                { icon: Youtube, label: "YouTube" },
                { icon: Mail, label: "Email" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-accent hover:text-primary transition-all duration-300"
                  aria-label={label}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-8">
          <p className="text-center text-primary-foreground/60 text-sm">
            &copy; {currentYear} SCOAN & Emmanuel TV. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
