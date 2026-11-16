"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="text-center mb-16">
        <span className="text-xs uppercase font-bold tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          Get in Touch
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-white">
          Contact Support & Feedback
        </h1>
        <p className="mt-4 text-base text-gray-400">
          Have questions about running CapScribe AI locally or planning a cloud deployment? We are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Column */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800">
            <Mail className="w-6 h-6 text-blue-400 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Email Us</h3>
            <p className="text-xs text-gray-400">Direct support for installation, features, and custom presets.</p>
            <p className="mt-3 text-sm font-semibold text-blue-400">support@capscribe.ai</p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800">
            <MessageSquare className="w-6 h-6 text-emerald-400 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Community Hub</h3>
            <p className="text-xs text-gray-400">Join other creators and AI video developers.</p>
            <p className="mt-3 text-sm font-semibold text-emerald-400">Discord & GitHub Discussions</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 p-8 rounded-3xl bg-gray-900/60 border border-gray-800">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Message Received!</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Thank you for reaching out. In development mode, your message has been logged to the studio console.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-xs font-semibold text-blue-400 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sarah Miller"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@creator.io"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Question about Windows GPU setup"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Message</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we assist your video workflow?"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
