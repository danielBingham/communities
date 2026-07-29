## [Update User: MFA](documentation/testing/test-cases/User/update/mfa.md)

Cases cover Multifactor Authentication (MFA) setup.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] An authenticator app is available to enrol.

#### Cases

- [ ] As a user, I can enable multifactor authentication.
    - As User1:
        - Select "Multifactor Authentication" from the UserMenu.
        - Click "Setup Multifactor Authentication"
        - Use an authentication app to follow the QR code.
            - **Confirm app loads an authentication site with correct values for Site (Communities) and email (User1's email).**
        - Enter an invalid 6 digit code.
            - **Confirm error.**
        - Enter the 6 digit code from the authentication app to confirm setup.
            - **Confirm setup confirmed and recovery codes presented.**
            - **Confirm email notifying of MFA change.**
        - Save the backup codes somewhere accessible.

- [ ] As a user, my MFA secret and recovery codes do not leak in application responses after setup.
    - As User1:
        - With browser developer tools open (Network tab), complete MFA setup and continue using the app.
            - **Confirm the secret only appears in the response to the setup (pending) request.**
            - **Confirm the recovery codes only appear in the response that confirms setup.**
        - Reload the app and inspect the authenticated user object and subsequent responses.
            - **Confirm neither the secret nor the recovery codes appear in any later response.**

### Manual Regression

#### Pre-requisites

- [ ] User1 has been registered.
- [ ] An authenticator app is available to enrol.

#### Cases

All of the MFA setup cases require an authenticator app (or a generated TOPT
secret) and so cannot be covered by the Integration suite.

- [ ] As a user, I can set up MFA by manually entering the secret instead of scanning the QR code.
    - As User1:
        - Start MFA setup from the Security settings.
        - Copy the displayed secret (or use the copy button) and enter it manually into an authenticator app.
            - **Confirm the app generates codes for Communities with User1's email.**
        - Enter a valid code to confirm setup.
            - **Confirm setup succeeds and recovery codes are presented.**

- [ ] As a user, I can cancel MFA setup before confirming and remain without MFA.
    - As User1:
        - Start MFA setup and reach the QR/secret screen.
        - Click "Cancel Setup".
            - **Confirm MFA is left disabled.**
        - Log out and log back in.
            - **Confirm no MFA screen is shown.**

- [ ] As a user, if I refresh the page mid-setup I can safely restart setup.
    - As User1:
        - Start MFA setup and reach the QR/secret screen.
        - Refresh the browser.
            - **Confirm setup has reset (no stale secret) and MFA is disabled.**
        - Start setup again.
            - **Confirm a new QR/secret is generated and setup can be completed.**

- [ ] As a user, my MFA secret is only shown once, during setup.
    - As User1:
        - Complete MFA setup.
        - Navigate away and return to the MFA settings screen.
            - **Confirm the secret and QR code are not shown again.**
            - **Confirm only the enabled state and a disable option are shown.**

- [ ] As a user, my recovery codes are only shown once, during setup.
    - As User1:
        - Complete MFA setup so recovery codes are displayed.
        - Click "Complete Setup".
        - Navigate away and return to the MFA settings screen.
            - **Confirm the recovery codes are not shown again.**

- [ ] As a user, my recovery codes are not shown again if I refresh the recovery-codes screen.
    - As User1:
        - Complete MFA setup so recovery codes are displayed.
        - Refresh the browser while the codes are shown.
            - **Confirm the codes are not shown again and I am not left mid-setup.**

- [ ] As a user, disabling and re-enabling MFA invalidates my old authenticator entry and old recovery codes.
    - As User1:
        - With MFA enabled, disable MFA.
        - Re-enable MFA and complete setup with a newly scanned secret.
        - Log out and attempt to log in using a code from the *old* authenticator entry.
            - **Confirm the old code is rejected.**
        - Attempt to log in using one of the *old* recovery codes.
            - **Confirm the old recovery code is rejected.**
        - Log in using the new authenticator entry.
            - **Confirm success.**

### Full Regression

#### Pre-requisites

- [ ] User1 has been registered.

#### Cases

- [ ] As a user who is not mid-MFA-setup, a setup verification is refused. (covered: integration)
    - As User1 (MFA not being set up):
        - Submit an MFA setup verification.
            - **Confirm the request is rejected.**

- [ ] As a user mid-MFA-setup, a verification with no token is refused. (covered: integration)
    - As User1:
        - Start MFA setup and reach the QR/secret screen.
        - Submit the verification with no token supplied.
            - **Confirm the request is rejected.**
