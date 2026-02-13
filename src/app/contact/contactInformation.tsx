export default function ContactInformation() {
  return (
    <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
      <h2 className="text-2xl font-bold mb-6">
        Contact Information
      </h2>

      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">
              Phone
            </h3>
            <a
              href="tel:5551234567"
              className="text-muted-foreground hover:text-primary block"
            >
              (555) 123-4567
            </a>
            <p className="text-sm text-muted-foreground mt-1">
              Monday - Friday: 8:00 AM - 5:00 PM
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">
              Email
            </h3>
            <a
              href="mailto:info@shorelinewoodworks.com"
              className="text-muted-foreground hover:text-primary block break-all"
            >
              info@shorelinewoodworks.com
            </a>
            <p className="text-sm text-muted-foreground mt-1">
              We'll respond within 24 hours
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">
              Location
            </h3>
            <p className="text-muted-foreground">
              Your Local Area
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Serving the local community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}