import { LessThan } from "typeorm";
export class ExpressRateLimitTypeOrmStore {
    repo;
    windowMs;
    constructor(repo) {
        this.repo = repo;
    }
    init(options) {
        this.windowMs = options.windowMs;
        setInterval(() => this.clearExpired(), this.windowMs);
    }
    async clearExpired() {
        await this.repo.delete({
            resetTime: LessThan(new Date()),
        });
    }
    async get(key) {
        const fromDb = await this.getFromDb(key);
        if (fromDb) {
            return this.transform(fromDb);
        }
    }
    async getResponse(key) {
        const fromDb = await this.getFromDb(key);
        if (fromDb) {
            return fromDb;
        }
        const newModel = {
            key,
            resetTime: new Date(Date.now() + this.windowMs),
            totalHits: 0,
        };
        return this.repo.save(newModel);
    }
    async increment(key) {
        const resp = await this.getResponse(key);
        const now = Date.now();
        if (resp.resetTime && resp.resetTime.getTime() <= now) {
            this.resetClient(resp, now);
        }
        resp.totalHits++;
        return this.transform(await this.repo.save(resp));
    }
    resetClient(client, now = Date.now()) {
        client.totalHits = 0;
        client.resetTime.setTime(now + this.windowMs);
        return client;
    }
    async decrement(key) {
        const fromDb = await this.getFromDb(key);
        if (!fromDb) {
            return;
        }
        fromDb.totalHits--;
        await this.repo.save(fromDb);
    }
    async resetKey(key) {
        await this.repo.delete({
            key,
        });
    }
    async resetAll() {
        await this.repo.clear();
    }
    transform(model) {
        return {
            totalHits: model.totalHits,
            resetTime: model.resetTime,
        };
    }
    getFromDb(key) {
        return this.repo.findOneBy({
            key,
        });
    }
    get localKeys() {
        return false;
    }
}
