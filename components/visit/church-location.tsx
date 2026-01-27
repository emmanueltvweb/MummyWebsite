import { MapPin, Clock, Phone } from "lucide-react"

export function ChurchLocation() {
  const churchAddress = {
    street: "1, Segun Irefin Street,",
    area: "Agodo, Egbe,",
    city: "Lagos, Nigeria",
    fullAddress: "1, Segun Irefin Street, Agodo, Egbe, Lagos, Nigeria"
  }

  const serviceTimes = [
    { day: "Sunday", time: "8:00 AM" },

  ]

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Address Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Church Address
              </h2>
              <p className="text-muted-foreground">
                Find us at our main location
              </p>
            </div>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Address</h3>
                  <address className="text-muted-foreground not-italic">
                    <div className="select-text">{churchAddress.street}</div>
                    <div className="select-text">{churchAddress.area}</div>
                    <div className="select-text">{churchAddress.city}</div>
                  </address>
                </div>
              </div>

              {/* Service Times */}
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Service Time</h3>
                  <div className="space-y-2 text-muted-foreground">
                    {serviceTimes.map((service, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{service.day}:</span>
                        <span>{service.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Contact</h3>
                  <p className="text-muted-foreground">
                    For inquiries, please call: +234 123 456 7890
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl p-8">
              <div className="w-full h-full bg-background rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src="/churchvisit/Church2.jpg"
                  alt="The Synagogue, Church Of All Nations main building in Lagos, Nigeria"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-xl" />
          </div>
        </div>
      </div>
    </section>
  )
}