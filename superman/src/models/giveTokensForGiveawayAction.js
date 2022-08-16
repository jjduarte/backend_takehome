import {
	getModelFromInternalDB,
	upsertModelInInternalDB,
	listModelsFromInternalDB,
	addModelToInternalDB
} from "../db/internalDB.js";
import _ from "lodash";
import { getTokenPerUser } from '../business/giveTokensForGiveawayCalculations.js';

const REQUIRED_PROPERTIES = ['brandID', 'tokensAmount'],
 METHOD_NOT_ALLOWED_ERROR = 'Cannot upsert or update a giveaway';

export const hooks = {
	
	upsert: () => {
		throw METHOD_NOT_ALLOWED_ERROR;
	},

	update: () => {
		throw METHOD_NOT_ALLOWED_ERROR;
	},

	create: (giveawayAction) => {
		// Validations
		if (typeof giveawayAction !== "object") {
			throw `giveawayAction does not accept anything other than a single object as input, you passed in a ${typeof giveawayAction} type that looks like this: ${JSON.stringify(
				giveawayAction
			)}`;
		}

		REQUIRED_PROPERTIES.forEach(property => {
			if (!(property in giveawayAction)) {
				throw `giveawayAction requires the following fields: (${REQUIRED_PROPERTIES.toString()}) the input was this: ${JSON.stringify(
					giveawayAction
				)}`;
			}
		})

		if (giveawayAction.tokensAmount <= 0) {
			throw `Invalid number of tokens. Value must be greater than 0;`
		}
		return giveawayAction;
	},

	createPost: (giveawayAction, extra) => {

		// Find brand assuming it exists
		const brand = getModelFromInternalDB('brand', { id: giveawayAction.brandID });

		// Fetch users
		const users = listModelsFromInternalDB('userAccount', {});

		const tokensPerUser = users.length ? getTokenPerUser(users.length, giveawayAction.tokensAmount) : 0;
		
		if (users.length) {
			
			users.forEach((user) => {
				const userWallet = (user.tokens ?? []).find(token => token.brandID === brand.id) ?? {
					brandID: brand.id,
					balance: 0,
					USDBalance: 0,
					lastUpdated: null,
				};
				userWallet.balance += tokensPerUser;
				// use timestamp instead of MMM DD YYYY or formatted Coordenated Universal Time
				userWallet.lastUpdated = giveawayAction.createdAt;

				upsertModelInInternalDB('userAccount', {
					tokens: [userWallet, ...(user.tokens ?? []).filter(tok => tok.brandID !== brand.id)]
				}, { id: user.id });
			})
		}

		addModelToInternalDB(`givawayHistory`, {
			source: '/api/giveaway/create',
			createdAt: giveawayAction.createdAt,
			data: {
				...giveawayAction
			}
		});

		return {
			...giveawayAction,
			tokensPerUser: tokensPerUser,
			awardedUsers: users.length
		};
	},
};
