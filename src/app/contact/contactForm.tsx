export default function ContactForm() {
  return (
    <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
      <h2 className="text-2xl font-bold mb-6">
        Send Us a Message
      </h2>

      <form className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-2"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Your name"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium mb-2"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium mb-2"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            placeholder="Tell us about your project..."
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors duration-200 hover:bg-primary/90 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send Message
        </button>
      </form>
    </div>
  );
}