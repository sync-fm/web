"use client";

import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

export default function TermsPage() {
	return (
		<div className="relative min-h-screen overflow-hidden bg-background text-foreground">
			{/* Background effects similar to home page */}
			<div className="fixed inset-0 z-0">
				<div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
				<div className="absolute -bottom-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
			</div>

			<div className="relative z-10 flex min-h-screen flex-col">
				<LandingNav />

				<main className="flex-1 px-6 py-24 sm:px-10">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="mx-auto max-w-4xl rounded-3xl border glass-border-light glass-bg-medium p-8 backdrop-blur-xl sm:p-12"
					>
						<h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
						<p className="mb-8 text-sm text-muted-foreground">Last updated: November 22, 2025</p>

						<div className="prose prose-invert max-w-none text-muted-foreground">
							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">1. Introduction</h2>
								<p className="mb-4">
									Welcome to SyncFM ("we," "our," or "us"). By accessing or using our website,
									application, and services (collectively, the "Service"), you agree to be bound by
									these Terms of Service ("Terms"). If you do not agree to these Terms, please do
									not use our Service.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									2. Description of Service
								</h2>
								<p className="mb-4">
									SyncFM provides a universal music link conversion service that allows users to
									share music across different streaming platforms (such as Spotify, Apple Music,
									and YouTube Music). We facilitate the discovery and sharing of music by converting
									links between these services.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">3. User Accounts</h2>
								<p className="mb-4">
									To access certain features of the Service, you may be required to create an
									account. You can sign up using third-party authentication providers (Discord,
									GitHub, Google). You are responsible for maintaining the confidentiality of your
									account and for all activities that occur under your account.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">4. User Conduct</h2>
								<p className="mb-4">
									You agree not to use the Service for any unlawful purpose or in any way that
									interrupts, damages, or impairs the service. Specifically, you agree not to:
								</p>
								<ul className="list-disc pl-6 space-y-2">
									<li>Use the Service to distribute malware or harmful content.</li>
									<li>Attempt to gain unauthorized access to our systems or user accounts.</li>
									<li>
										Use the Service for automated scraping or high-volume API requests without our
										permission.
									</li>
									<li>Harass, abuse, or harm another person or group.</li>
								</ul>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									5. Intellectual Property
								</h2>
								<p className="mb-4">
									The Service and its original content, features, and functionality are owned by
									SyncFM and are protected by international copyright, trademark, patent, trade
									secret, and other intellectual property or proprietary rights laws. Our source
									code is available under the GPL-3.0 License, but the branding and service
									operation are proprietary.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">6. Termination</h2>
								<p className="mb-4">
									We may terminate or suspend your account and bar access to the Service
									immediately, without prior notice or liability, under our sole discretion, for any
									reason whatsoever and without limitation, including but not limited to a breach of
									the Terms.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									7. Disclaimer of Warranties
								</h2>
								<p className="mb-4">
									The Service is provided on an "AS IS" and "AS AVAILABLE" basis. SyncFM makes no
									representations or warranties of any kind, express or implied, regarding the
									operation of the Service or the information, content, or materials included on the
									Service.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									8. Limitation of Liability
								</h2>
								<p className="mb-4">
									In no event shall SyncFM, its directors, employees, partners, agents, suppliers,
									or affiliates, be liable for any indirect, incidental, special, consequential, or
									punitive damages, including without limitation, loss of profits, data, use,
									goodwill, or other intangible losses, resulting from your access to or use of or
									inability to access or use the Service.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">9. Contact Us</h2>
								<p className="mb-4">
									If you have any questions about these Terms, please contact us at{" "}
									<a href="mailto:hi@syncfm.dev" className="text-primary hover:underline">
										hi@syncfm.dev
									</a>
									.
								</p>
							</section>
						</div>
					</motion.div>
				</main>

				<LandingFooter />
			</div>
		</div>
	);
}
