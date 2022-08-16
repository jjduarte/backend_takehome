import { brand, userAccount } from '../../../../seed_data/test';

function pickRandom(arr) {
    const random = Math.floor(Math.random() * (arr.length - 1) + 0);
    return arr[random];
}

function getTokenByBrandId(user, brandID) {
    return (user.tokens ?? []).find(token => token.brandID === brandID) ?? {
        brandID: brandID,
        balance: 0,
        USDBalance: 0,
        lastUpdated: null,
    };
}

describe("Giveaway", () => {
    const brandModel = pickRandom(brand);
    const brandID = brandModel.id;
    
    before(() => {
        cy.post('test/clear-db');

        cy.post('admin/seed_data/test').then(res => {
            expect(res.status).to.eq(200);
        });
    });

    // CREATE

    it("create: Giveaway model - reject with 0 or negative number of tokens", () => {
        const wrongAmounts = [-1, 0, -100, -10.5];

        cy.post('api/giveaway/create', {
            brandID,
            tokensAmount: pickRandom(wrongAmounts)
        }).then(res => {
            expect(res.status).to.eq(500, "wrong status code");
            expect(res.body.error).to.match(/Invalid number of tokens. Value must be greater than 0;/);
        });
    });

    it("create: Giveaway model ", () => {
        
        const validTokenAmounts = [1, 77, 1000000];
        let users = userAccount;
        const tokensAmount = pickRandom(validTokenAmounts);
        let tokensPerUser = tokensAmount / userAccount.length;

        cy.post('api/giveaway/create', {
            brandID,
            tokensAmount,
        }).then(res => {
            expect(res.status).to.eq(200, "wrong status code");
            expect(res.body.id).not.to.eq(undefined);
            expect(res.body.id.length).not.to.eq(0);
            expect(res.body.awardedUsers).to.eq(users.length);
        });

        users.forEach(user => {
            cy.post('api/userAccount/get', {
                id: user.id
            }).then(res => {
                const tokenBeforeGiveaway = getTokenByBrandId(user, brandID);
                const tokenAfterGiveaway = getTokenByBrandId(res.body, brandID);
                expect(res.status).to.eq(200, "wrong status code");
                expect(tokenAfterGiveaway.balance).to.eq(tokenBeforeGiveaway.balance + tokensPerUser, `User ${user.id} wrong amount of tokens`);
            });
        })
    });

    // GET

    it("get: Giveaway model - should succeed", () => {

        cy.post('api/giveaway/get', {
            brandID,
        }).then(res => {
            expect(res.status).to.eq(200, "failed getting giveaway");
        });
    });

    // LIST

    it('list: giveaway model - expect one', () => {
        cy.post('api/giveaway/list', {}).then(res => {
            expect(res.status).to.eq(200, "wrong status code");
            expect(res.body.length).not.to.eq(0);
        });
    });

    it('list: models - use search params', () => {
        cy.post('api/giveaway/list', {
            brandID
        }).then(res => {
            expect(res.status).to.eq(200, "wrong status code");
            expect(res.body.length).not.to.eq(0);
        });
    });

    // NOT ALLOWED METHODS: UPDATE/UPSERT
    let notAllowedMethods = ["update" , "upsert"];

    notAllowedMethods.forEach(method => {
        it(`${method}: giveaway model - should fail`, () => {
            cy.post(`api/giveaway/${method}`, {
                brandID
            }).then(res => {
                expect(res.status).to.eq(500, "wrong status code");
                expect(res.body.error).not.to.eq(undefined);
            });
        })
    })

});
