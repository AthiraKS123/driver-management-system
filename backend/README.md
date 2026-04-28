1️⃣ 📁 CONTROLLERS (API LAYER)
👉 Purpose:

Talks to frontend only

What it does:
receives request
sends response
What it should NOT do:

❌ DB queries
❌ complex logic
❌ calculations

Think of it like:

👉 “Reception desk”



📁 SERVICES (BUSINESS LOGIC)
👉 Purpose:

This is where REAL work happens

What it does:
MongoDB queries
filtering logic
pagination logic
sorting logic
Why needed?

Because:

same logic can be reused
controllers stay clean
easier to test
Think of it like:

👉 “Chef in kitchen”





📁 MIDDLEWARES (REQUEST HELPERS)
👉 Purpose:

Runs BEFORE controller

You created:

✅ auth middleware
checks JWT
sets req.user.id
✅ error handler
catches all errors in one place
Think of it like:

👉 “Security + safety system”




UTILS (HELPER FUNCTIONS)
👉 Purpose:

Reusable small tools

You created:

asyncHandler
removes repeated try/catch