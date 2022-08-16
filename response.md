# Todo:

1. Tests
	-  `campaignTypeTracker` was initialized and only used in an always true comparison that was setting the model returned to be an empty object `defaultCampaign`. Both variable initialization and comparison were removed in order to fix tests.

2. Tests
   - Added e2es tests
   - Added unit tests

3. Implement giveaway endpoint to distribute brand tokens to all users in the db.
   -  endpoint url: `localhost:1938/api/giveaway/create`
   - method: POST
   - body:
```
	{
		"brandID": "1",
		"tokensAmount": 10000
	}
```

4. Add a history record for each giveaway action
  - timestamp
  - data