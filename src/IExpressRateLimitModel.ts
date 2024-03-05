export interface IExpressRateLimitModel {
    /**
     * The key that will represent what the identifier for each client, this is normally the IP address
     */
    key: string;

    /**
     * How many hits the client has had since last reset
     */
    totalHits: number;

    /**
     * The time until the hit-count is reset to 0
     */
    resetTime: Date;
}
