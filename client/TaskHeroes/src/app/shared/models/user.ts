export interface User {
    username?: string;
    email?: string;
    id?:string;
    password?:string;
    role?:string;
    profilePicture?: string;
    /** * The "Truth" flag used to display the verified badge 
     * and toggle the 'Get Verified' reminder.
     */
    isIdentityVerified?: boolean;

    /** * Audit field to show how long a user has been trusted.
     */
    identityVerifiedAt?: Date | string;

    /** * The Identify ID (Session Reference) for internal tracking.
     */
    stripeVerificationSessionId?: string;
    stripeVerificationFingerprint?: string;
}