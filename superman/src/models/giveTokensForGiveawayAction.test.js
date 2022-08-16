import { addModelToInternalDB, getModelFromInternalDB } from "../db/internalDB.js";
import { runHooks } from "../routes/hooks/crudHooks.js";
import _ from "lodash";

describe("giveaway -- hooks", () => {
	it("createPost hook should return the distribute the tokens to all users", async () => {
		const BRAND_ID = '1';
		const TOKENS_AMOUNT = 10000;
		const USERS_AMOUNT = 10;
		const TOKENS_PER_USER = TOKENS_AMOUNT / USERS_AMOUNT;

		// add the brand first
		addModelToInternalDB(`brand`, { id: BRAND_ID, userID: "U1" });

		// Users
		for (let i = 0; i < USERS_AMOUNT; i++) {
			addModelToInternalDB(`userAccount`, { id: `user_${i}` });
		}

		const giveawayRequest = {
			"brandID": BRAND_ID,
			"tokensAmount": TOKENS_AMOUNT
		};

		// hook to distribute 
		const giveawayFromDB = await runHooks(`createPost`, `giveaway`, giveawayRequest, {});

		expect(giveawayFromDB.brandID).toBe(BRAND_ID);
		expect(giveawayFromDB.tokensAmount).toBe(TOKENS_AMOUNT);
		expect(giveawayFromDB.awardedUsers).toBe(USERS_AMOUNT);
		expect(giveawayFromDB.tokensPerUser).toBe(TOKENS_PER_USER);

		// Verify history record
		const giveawayHistoryFromDB = getModelFromInternalDB("givawayHistory", { data: giveawayRequest });
		expect(JSON.stringify(giveawayHistoryFromDB.data)).toBe(JSON.stringify(giveawayRequest));
		expect(giveawayHistoryFromDB.source).toBe('/api/giveaway/create');

	});
});
