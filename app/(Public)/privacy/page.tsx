"use client";

import { motion } from "framer-motion";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

export default function PrivacyPage() {
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
						<h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
						<p className="mb-8 text-sm text-muted-foreground">Last updated: November 22, 2025</p>

						<div className="prose prose-invert max-w-none text-muted-foreground">
							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">1. Introduction</h2>
								<p className="mb-4">
									SyncFM ("we," "our," or "us") respects your privacy and is committed to protecting
									your personal data. This Privacy Policy explains how we collect, use, and share
									information about you when you use our website and services.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									2. Information We Collect
								</h2>
								<p className="mb-4">
									We collect information you provide directly to us and information we automatically
									collect when you use our Service.
								</p>
								<h3 className="mb-2 text-lg font-medium text-foreground">Account Information</h3>
								<p className="mb-4">
									When you create an account, we collect information from your chosen authentication
									provider (Discord, GitHub, or Google), including your username, email address, and
									avatar image. We store this information to create and manage your user profile.
								</p>
								<h3 className="mb-2 text-lg font-medium text-foreground">Usage Data</h3>
								<p className="mb-4">
									We collect data about how you interact with our Service, such as the music links
									you create, the pages you visit, and the features you use. This helps us
									understand how our Service is used and how we can improve it.
								</p>
								<h3 className="mb-2 text-lg font-medium text-foreground">Technical Data</h3>
								<p className="mb-4">
									We automatically collect certain technical information, including your IP address,
									browser type, device information, and operating system.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									3. How We Use Your Information
								</h2>
								<p className="mb-4">We use the information we collect to:</p>
								<ul className="list-disc pl-6 space-y-2">
									<li>Provide, maintain, and improve our Service.</li>
									<li>Process and complete your requests (e.g., converting music links).</li>
									<li>
										Monitor and analyze trends, usage, and activities in connection with our
										Service.
									</li>
									<li>Detect, prevent, and address technical issues and security threats.</li>
								</ul>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									4. Data Sharing and Third Parties
								</h2>
								<p className="mb-4">
									We do not sell your personal data. We may share your information with third-party
									service providers who help us operate our Service:
								</p>
								<ul className="list-disc pl-6 space-y-2">
									<li>
										<strong>PostHog:</strong> We use PostHog for product analytics to understand
										user behavior.
									</li>
									<li>
										<strong>Streaming Services:</strong> When you convert a link, we interact with
										APIs from services like Spotify, Apple Music, and YouTube Music. We do not share
										your personal account information with these services unless you explicitly
										connect your account.
									</li>
								</ul>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									5. Cookies and Tracking Technologies
								</h2>
								<p className="mb-4">
									We use cookies and similar tracking technologies to track the activity on our
									Service and hold certain information. Cookies are files with a small amount of
									data which may include an anonymous unique identifier. You can instruct your
									browser to refuse all cookies or to indicate when a cookie is being sent.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">6. Data Security</h2>
								<p className="mb-4">
									The security of your data is important to us. We employ robust security measures
									to store your data. However, remember that no method of transmission over the
									Internet, or method of electronic storage is 100% secure.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">7. Your Rights</h2>
								<p className="mb-4">
									You have the right to access, update, or delete the information we have on you. If
									you wish to delete your account and all associated data, please contact us.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">
									8. Changes to This Privacy Policy
								</h2>
								<p className="mb-4">
									We may update our Privacy Policy from time to time. We will notify you of any
									changes by posting the new Privacy Policy on this page and updating the "Last
									updated" date.
								</p>
							</section>

							<section className="mb-8">
								<h2 className="mb-4 text-xl font-semibold text-foreground">9. Contact Us</h2>
								<p className="mb-4">
									If you have any questions about this Privacy Policy, please contact us at{" "}
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
