import React, { useEffect } from 'react'

import './TermsOfService.css'

const TermsOfService = function({}) {

    useEffect(function() {
        if ( document.location.hash ) {
            document.querySelector(document.location.hash).scrollIntoView({
                block: 'center'
            })
        }
    }, [])

    return (
        <article className="tos">
            <h1>Communities Terms of Service</h1>
            <p>Effective Date: [Date]</p>
            <p>Thank you for using Communities! These Terms of Service ("Terms") govern your use of the Communities platform (the "Service") operated by Communities Social, LLC ("Communities," "we," "us," or "our").  </p>
            <h2>A. Definitions</h2>
            <p><strong>Short version:</strong> <em>We use basic terms throughout these Terms and they have specific meanings.</em></p>
            <ul>
                <li>“Account” refers to your legal relationship with Communities.</li>
                <li>"Agreement" refers, collectively, to all the terms, conditions, notices contained or referenced in this document (the “Terms of Service” or the "Terms") and all other operating rules, policies and procedures that we may publish from time to time on the Website. </li>
                <li>"Beta Features" mean software, services, or features identified as alpha, beta, preview, early access, or evaluation, or words or phrases with similar meanings.</li>
                <li>"Communities," "we," "us," and "our" refer to Communities Social, LLC, as well as our affiliates, directors, subsidiaries, contractors, licensors, officers, agents, and employees.</li>
                <li>"Content" refers to content featured or displayed through the Service, including text, data, articles, images, photographs, graphics, designs, features, and other materials. </li>
                <li>“User-Generated Content” is Content, written or otherwise, created or uploaded by our Users. </li>
                <li>"Your Content" is Content that you create or own.</li>
                <li>"Service" refers to the applications, software, products, and services provided by Communities.</li>
                <li>"User," "you," and "your" refer to the individual person, company, or organization that has visited or is using the Service.</li>
                <li>“Website” refers to Communities’ website located at https://communities.social, and all content, services, and products provided by Communities at or through the Website.</li>
            </ul>
            <h2>B. Open Beta</h2>
            <p><strong>Short version:</strong> <em>Communities Social, LLC is a temporary structure formed during our bootstrapping phase while we design and assemble the planned cooperative structure. These terms will be transferred over to the cooperative once it is formed. The Communities platform is currently in Open Beta. The terms defined in Section G. Beta Features apply to the entire Service for the duration of the Open Beta period.</em></p>

            <h3>1. Temporary Structure</h3>
            <p>Communities Social, LLC is a temporary structure formed during our bootstrapping phase while we develop the planned cooperative structure and form the non-profit.  Once the non-profit cooperative is formed, Communities Social, LLC will be dissolved and the Service and these terms will be transferred to the non-profit.</p>

            <h3>2. Open Beta Period</h3>
            <p>The Communities platform and Service are currently in an Open Beta period. The terms defined in Section G. Beta Features apply to the entire Service for the duration of the Open Beta period. The Service is available for public use, but is not complete yet.  The full range of security measures required for a 1.0 release are not in place and the Service has not been audited for security. Please use it at your own risk.</p>
            <h2>C. Account Terms</h2>
            <p><strong>Short version:</strong> <em>A human must create your account; you must be 18 or over; you must provide a valid email address; and you alone are responsible for your account and anything that happens while you are signed in to or using your account. You are responsible for keeping your Account secure.</em></p>
            <h3>1. Account Controls</h3>
            <p>Subject to these Terms, you retain ultimate administrative control over your Account and the Content within it.</p>
            <h3>2. Required Information</h3>
            <p>You must provide a valid email address and confirm you are of legal age in order to complete the signup process. Any other information requested, such as your real name, is optional, unless you opt to contribute to Communities, in which case additional information will be necessary for billing purposes.</p>
            <h3>3. Account Requirements</h3>
            <p>We have a few simple rules for accounts on Communities:</p>
            <ul>
                <li>You must be a human to create an Account. Accounts registered by "bots" or other automated methods are not permitted.</li>
                <li>You must be age 18 or older.</li>
                <li>You must provide accurate information, including a valid email address.</li>
                <li>You may not use Communities in violation of export control or sanctions laws.</li>
            </ul>
            <h3>4. Account Security</h3>
            <p>You are responsible for keeping your account secure. We offer tools such to help you maintain your Account's security, but the content of your Account and its security are up to you.</p>
            <ul>
                <li>You are responsible for all Content posted and activity that occurs under your Account.</li>
                <li>You are responsible for maintaining the security of your Account and password. Communities cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</li>
                <li>You will promptly notify Communities by contacting us at contact@communities.social if you become aware of any unauthorized use of, or access to, our Service through your Account, including any unauthorized use of your password or Account.</li>
            </ul>
            <h3>5. Additional Terms</h3>
            <p>In some situations, third parties' terms may apply to your use of Communities. Please be aware that while these Terms are our full agreement with you, other parties' terms govern their relationships with you.</p>
            <h2>D. Acceptable Use</h2>
            <p><strong>Short version:</strong> <em>There are limits to the kinds of content that may be posted to Communities.  Violating these limits may result in the removal of your content, either using community moderation tools or through administrator moderation tools.  Repeatedly violating these limits may result in the loss of access to Service features, or the removal of your accounts and a permanent ban from the platform.</em></p>
            <h3>1. Compliance with Laws and Regulations</h3>
            <p>Your use of the Service must not violate any applicable laws, including copyright or trademark laws, export control laws, or other laws in your jurisdiction.</p>
            <h3>2. Content Restrictions</h3>
            <p>You may not post, upload, or otherwise share Content that:</p>
            <ul>
                <li>Is unlawful, threatening, abusive, harassing, or defamatory</li>
                <li>Impersonates any person or entity or otherwise misrepresents your affiliation with a person or entity</li>
                <li>Infringes any patent, trademark, trade secret, copyright, or other proprietary rights</li>
                <li>Promotes illegal activities or conduct that is abusive, threatening, or defamatory</li>
                <li>Contains or installs any viruses, worms, malware, trojan horses, or other content designed to interrupt, destroy, or limit the functionality of any computer software or hardware</li>
            </ul>
            <h3>3. Community Standards</h3>
            <p>All Content must adhere to our Community Standards, which define what kinds of content may be shared on the platform and what kinds of content are candidates for community or administrator moderation. Content may be moderated if it:</p>
            <ul>
                <li>Violates the <strong>Paradox of Tolerance</strong>. In order for a community to remain tolerant, it must be intolerant of intolerance.  Content is considered to be intolerant when it:
                    <ul>
                        <li><strong>Denies basic humanity.</strong> When content denies the basic humanity, or right to existence, of any person or group of people.</li>
                        <li><strong>Is hate speech.</strong> When content targets individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, national origin, or other protected characteristics.</li>
                    </ul>
                </li>
                <li>Propagates <strong>Misinformation, Disinformation, or Propaganda</strong>. Communities strives to be a place where people can have productive dialogs based on accurate information and share perspectives grounded in reality.</li>
            </ul>
            <h3>4. Violations of Acceptable Use</h3>
            <p>Violations of our Acceptable Use policy may be remediated in a range of ways, including but not limited to:</p>
            <ul>
                <li>Content may be moderated and suppressed or removed by your fellow Users through the use of our Community Moderation Tools.</li>
                <li>Content may be moderated and suppressed or removed by Us through the use of our Site Moderation Tools.</li>
                <li>Repeated violations may lead to Your Account being restricted and You may lose access to certain features of Communities (such as the ability to moderate others through the Community Moderation Tools).</li>
                <li>Continued violations may lead to Your Account being suspended and banned from the platform, either temporarily or permanent. </li>
            </ul>
            <h2>E. User-Generated Content</h2>
            <p><strong>Short version:</strong> <em>You own content you create, but you allow us certain rights to it, so that we can display and share the content you post. You still have control over your content, and responsibility for it, and the rights you grant us are limited to those we need to provide the service. We have the right to remove content or close Accounts if we need to.</em></p>
                <h3>1. Responsibility for Content</h3>
            <p>You may create or upload User-Generated Content while using the Service. You are solely responsible for the content of, and for any harm resulting from, any User-Generated Content that you post, upload, link to or otherwise make available via the Service, regardless of the form of that Content. We are not responsible for any public display or misuse of your User-Generated Content.</p>
            <h3>2. Communities May Remove Content</h3>
            <p>We have the right to refuse or remove any User-Generated Content that, in our sole discretion, violates any laws or Communities terms of policies. </p>
            <h3>3. Ownership of Content</h3>
            <p>You retain ownership of and responsibility for Your Content. If you're posting anything you did not create yourself or do not own the rights to, you agree that you are responsible for any Content you post; that you will only submit Content that you have the right to post; and that you will fully comply with any third party licenses relating to Content you post.</p>

            <p>Because you retain ownership of and responsibility for Your Content, we need you to grant us — and other Communities Users — certain legal permissions, listed in Sections E.4 — E.6. These license grants apply to Your Content. If you upload Content that already comes with a license granting Communities the permissions we need to run our Service, no additional license is required. You understand that you will not receive any payment for any of the rights granted in Sections E.4 — E.6. The licenses you grant to us will end when you remove Your Content from our servers, unless other Users have shared it.</p>
            <h3>4. License Grant to Us</h3>
            <p>We need the legal right to do things like host Your Content, publish it, and share it. You grant us and our legal successors the right to store, archive, parse, and display Your Content, and make incidental copies, as necessary to provide the Service, including improving the Service over time. This license includes the right to do things like copy it to our database and make backups; show it to you and other users; parse it into a search index or otherwise analyze it on our servers; share it with other users; and perform it, in case Your Content is something like music or video.</p>

            <p>This license does not grant Communities the right to sell Your Content. It also does not grant Communities the right to otherwise distribute or use Your Content outside of our provision of the Service.</p>
            <h3>5. License Grant to Other Users</h3>
            <p>Any Content you post may be viewed by others. By setting the privacy controls on your posts, you agree to allow others to view and share your Content as controlled by the Service’s privacy system. You grant each User who can view your content a nonexclusive, worldwide license to use, display, and perform Your Content through the Service and to reproduce Your Content solely on Communities as permitted through Communities’ functionality.</p>
            <h3>6. Moral Rights</h3>
            <p>You retain all moral rights to Your Content that you upload, publish, or submit to any part of the Service, including the rights of integrity and attribution. However, you waive these rights and agree not to assert them against us, to enable us to reasonably exercise the rights granted in Section E.4, but not otherwise.</p>

            <p>To the extent this agreement is not enforceable by applicable law, you grant Communites the rights we need to use Your Content without attribution and to make reasonable adaptations of Your Content as necessary to render the Website and provide the Service.</p>
            <h2>F. Moderation</h2>
            <p><strong>Short version:</strong> <em>We moderate content to maintain healthy communities. We will remove content that violates our Terms of Service and may suspend or terminate accounts that repeatedly violate our Community Standards.</em></p>
            <h3>1. Right to Moderate</h3>
            <p>Communities reserves the right to remove or restrict access to any Content that violates these Terms or our Community Standards as outlined in Section D.3., or to suspend or terminate accounts that repeatedly violate our policies.</p>
            <h3>2. Moderation Standards</h3>
            <p>Content moderation decisions are based on:</p>
            <ul>
                <li>Compliance with these Terms of Service</li>
                <li>Adherence to our Community Standards</li>
                <li>Protection of user safety and well-being</li>
            </ul>
            <h3>3. Appeals Process</h3>
            <p>If you believe content was removed in error or your account was incorrectly suspended, you may appeal by contacting us at <a href="mailto:contact@communities.social">contact@communities.social</a> with:</p>
            <ul>
                <li>Your account information</li>
                <li>The specific content or action in question</li>
                <li>An explanation of why you believe the action was taken in error</li>
            </ul>
            <p>We will review appeals promptly and respond within a reasonable timeframe.</p>
            <h3>4. Transparency</h3>
            <p>We are committed to transparency in our moderation practices and will provide clear explanations when content is removed or accounts are suspended.</p>
            <h2>G. Intellectual Property Notice</h2>
            <p><strong>Short version:</strong> <em>We own the service and all of our content. In order for you to use our content, we give you certain rights to it, but you may only use our content in the way we have allowed.</em></p>
            <h3>1. Communities's Rights to Content</h3>
            <p>Communities and our licensors, vendors, agents, and/or our content providers retain ownership of all intellectual property rights of any kind related to the Website and Service. We reserve all rights that are not expressly granted to you under this Agreement or by law. The look and feel of the Website and Service is copyright © Communities Social, LLC. All rights reserved. You may not duplicate, copy, or reuse any portion of the HTML/CSS, JavaScript, or visual design elements or concepts without express written permission from Communities.</p>
            <h3>2. Communities Trademarks and Logos</h3>
            <p>If you’d like to use Communities’s trademarks, you must follow all of our trademark guidelines.</p>
            <h3>3. License to Communities Policies</h3>
            <p>This Agreement is licensed under this Creative Commons Zero license.</p>
            <h2>H. Beta Features</h2>
            <p><strong>Short version:</strong> <em>Beta Features may not be supported or may change at any time. We'd love your feedback to make our Beta Features better.</em></p>
            <h3>1. Subject to Change</h3>
            <p>Beta Features may not be supported and may be changed at any time without notice. In addition, Beta Features have not yet been subjected to the full range of security measures and auditing necessary for a 1.0 release. By using a Beta Feature, you use it at your own risk.</p>
            <h3>2. Feedback</h3>
            <p>We’re always trying to improve our products and services, and your feedback as a Beta Feature user will help us do that. If you choose to give us any ideas, know-how, algorithms, code contributions, suggestions, enhancement requests, recommendations or any other feedback for our products or services (collectively, “Feedback”), you acknowledge and agree that Communities will have a royalty-free, fully paid-up, worldwide, transferable, sub-licensable, irrevocable and perpetual license to implement, use, modify, commercially exploit and/or incorporate the Feedback into our products, services, and documentation.</p>
            <h2>I. Payment</h2>
            <p><strong>Short version:</strong> <em>You are responsible for any fees associated with your use of Communities. We are responsible for communicating those fees to you clearly and accurately, and letting you know well in advance if those prices change.</em></p>
            <h3>1. Pricing</h3>
            <p>Communities uses a Pay What You Can, sliding scale subscription model.  Users are asked to contribute $10 / month to Communities development and upkeep, but payment is not required and you are welcome to use the service even if you are contributing less than that or nothing at all.</p>
            <h3>2. Billing Schedule; No Refunds</h3>
            <p>Contributions for the Service are billed in advance on a monthly basis and are non-refundable. There will be no refunds or credits for partial months of service, or refunds for months unused with an open Account. In order to treat everyone equally, no exceptions will be made.</p>
            <h3>3. Authorization</h3>
            <p>By setting up a contribution and agreeing to these Terms, you are giving us permission to charge your on-file credit card, or other approved methods of payment for fees that you authorize for Communities.</p>
            <h3>J. Cancellation and Termination</h3>
            <p><strong>Short version:</strong> <em>You may close your Account at any time. If you do, we'll treat your information responsibly.</em></p>
            <h3>1. Account Cancellation</h3>
            <p>It is your responsibility to properly cancel your Account with Communities. You can cancel your Account at any time by going into your Settings. The Account screen provides a simple, no questions asked cancellation link. We are not able to cancel Accounts in response to an email or phone request.</p>
            <h3>2. Upon Cancellation</h3>
            <p>We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements, but barring legal requirements, we will delete your full profile and all of Your Content within 90 days of cancellation or termination (though some information may remain in encrypted backups). This information cannot be recovered once your Account is canceled.</p>
            <h3>3. Communities May Terminate</h3>
            <p>Communities has the right to suspend or terminate your access to all or any part of the Website at any time, with or without cause, with or without notice, effective immediately. Communities reserves the right to refuse service to anyone for any reason at any time.</p>
            <h3>4. Survival</h3>
            <p>All provisions of this Agreement which, by their nature, should survive termination will survive termination — including, without limitation: ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
            <h2>K. Communications with Communities</h2>
            <p><strong>Short version:</strong> <em>We use email and other electronic means to stay in touch with our users.</em></p>
            <h3>1. Electronic Communication Required</h3>
            <p>For contractual purposes, you (1) consent to receive communications from us in an electronic form via the email address you have submitted or via the Service; and (2) agree that all Terms of Service, agreements, notices, disclosures, and other communications that we provide to you electronically satisfy any legal requirement that those communications would satisfy if they were on paper. This section does not affect your non-waivable rights.</p>
            <h3>2. Legal Notice to Communities Must Be in Writing</h3>
            <p>Communications made through email or Communities Support's messaging system will not constitute legal notice to Communities or any of its officers, employees, agents or representatives in any situation where notice to Communities is required by contract or any law or regulation. Legal notice to Communities must be in writing and served on Communities's legal agent.</p>
            <h3>3. No Phone Support</h3>
            <p>Communities only offers support via email, in-Service communications, and electronic messages. We do not offer telephone support.</p>
            <h2>L. Disclaimer of Warranties</h2>
            <p><strong>Short version:</strong> <em>We provide our service as is, and we make no promises or guarantees about this service. Please read this section carefully; you should understand what to expect.</em></p>
            <p>Communities provides the Website and the Service “as is” and “as available,” without warranty of any kind. Without limiting this, we expressly disclaim all warranties, whether express, implied or statutory, regarding the Website and the Service including without limitation any warranty of merchantability, fitness for a particular purpose, title, security, accuracy and non-infringement.</p>
            <p>Communities does not warrant that the Service will meet your requirements; that the Service will be uninterrupted, timely, secure, or error-free; that the information provided through the Service is accurate, reliable or correct; that any defects or errors will be corrected; that the Service will be available at any particular time or location; or that the Service is free of viruses or other harmful components. You assume full responsibility and risk of loss resulting from your downloading and/or use of files, information, content or other material obtained from the Service.</p>
            <h2>M. Limitation of Liability</h2>
            <p><strong>Short version:</strong> <em>We will not be liable for damages or losses arising from your use or inability to use the service or otherwise arising under this agreement. Please read this section carefully; it limits our obligations to you.</em></p>
            <p>You understand and agree that we will not be liable to you or any third party for any loss of profits, use, goodwill, or data, or for any incidental, indirect, special, consequential or exemplary damages, however arising, that result from</p>
            <ul>
                <li>the use, disclosure, or display of your User-Generated Content;</li>
                <li>your use or inability to use the Service;</li>
                <li>any modification, price change, suspension or discontinuance of the Service;</li>
                <li>the Service generally or the software or systems that make the Service available;</li>
                <li>unauthorized access to or alterations of your transmissions or data;</li>
                <li>statements or conduct of any third party on the Service;</li>
                <li>any other user interactions that you input or receive through your use of the Service; or</li>
                <li>any other matter relating to the Service.</li>
            </ul>
            <p>Our liability is limited whether or not we have been informed of the possibility of such damages, and even if a remedy set forth in this Agreement is found to have failed of its essential purpose. We will have no liability for any failure or delay due to matters beyond our reasonable control.</p>
            <h2>N. Release and Indemnification</h2>
            <p><strong>Short version:</strong> <em>You are responsible for your use of the service. If you harm someone else or get into a dispute with someone else, we will not be involved.</em></p>
            <p>If you have a dispute with one or more Users, you agree to release Communities from any and all claims, demands and damages (actual and consequential) of every kind and nature, known and unknown, arising out of or in any way connected with such disputes.</p>
            <p>You agree to indemnify us, defend us, and hold us harmless from and against any and all claims, liabilities, and expenses, including attorneys’ fees, arising out of your use of the Website and the Service, including but not limited to your violation of this Agreement, provided that Communities (1) promptly gives you written notice of the claim, demand, suit or proceeding; (2) gives you sole control of the defense and settlement of the claim, demand, suit or proceeding (provided that you may not settle any claim, demand, suit or proceeding unless the settlement unconditionally releases Communities of all liability); and (3) provides to you all reasonable assistance, at your expense.</p>
            <h2>O. Changes to These Terms</h2>
            <p><strong>Short version:</strong> <em>We want our users to be informed of important changes to our terms, but some changes aren't that important — we don't want to bother you every time we fix a typo. So while we may modify this agreement at any time, we will notify users of any material changes and give you time to adjust to them.</em></p>
            <p>We reserve the right, at our sole discretion, to amend these Terms of Service at any time and will update these Terms of Service in the event of any such amendments. We will notify our Users of material changes to this Agreement at least 30 days prior to the change taking effect by posting a notice on our Website or sending email to the primary email address specified in your Communities account. Customer's continued use of the Service after those 30 days constitutes agreement to those revisions of this Agreement. For any other modifications, your continued use of the Website constitutes agreement to our revisions of these Terms of Service. </p>
            <p>We reserve the right at any time and from time to time to modify or discontinue, temporarily or permanently, the Website (or any part of it) with or without notice.</p>
            <h2>P. Miscellaneous</h2>
            <h3>1. Governing Law</h3>
            <p>Except to the extent applicable law provides otherwise, this Agreement between you and Communities and any access to or use of the Website or the Service are governed by the federal laws of the United States of America and the laws of the State of Indiana, without regard to conflict of law provisions. You and Communities agree to submit to the exclusive jurisdiction and venue of the courts located in the City and County of Bloomington, Monroe, Indiana.</p>
            <h3>2. Non-Assignability</h3>
            <p>Communities may assign or delegate these Terms of Service, in whole or in part, to any person or entity at any time with or without your consent, including the license grant in Section E.4. You may not assign or delegate any rights or obligations under the Terms of Service or Privacy Statement without our prior written consent, and any unauthorized assignment and delegation by you is void.</p>
            <h3>3. Section Headings and Summaries</h3>
            <p>Throughout this Agreement, each section includes titles and brief summaries of the following terms and conditions. These section titles and brief summaries are not legally binding.</p>
            <h3>4. Severability, No Waiver, and Survival</h3>
            <p>If any part of this Agreement is held invalid or unenforceable, that portion of the Agreement will be construed to reflect the parties’ original intent. The remaining portions will remain in full force and effect. Any failure on the part of Communities to enforce any provision of this Agreement will not be considered a waiver of our right to enforce such provision. Our rights under this Agreement will survive any termination of this Agreement.</p>
            <h3>5. Amendments; Complete Agreement</h3>
            <p>This Agreement may only be modified by a written amendment signed by an authorized representative of Communities, or by the posting by Communities of a revised version in accordance with Section O. Changes to These Terms. These Terms of Service represent the complete and exclusive statement of the agreement between you and us. This Agreement supersedes any proposal or prior agreement oral or written, and any other communications between you and Communities relating to the subject matter of these terms including any confidentiality or nondisclosure agreements.</p>
        </article>
    )


}

export default TermsOfService
