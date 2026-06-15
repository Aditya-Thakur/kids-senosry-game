Hi team,

You asked that when a user changes their password, they should be logged out from all computers and forced to log in again with the new password.

We can do this fully from the backend. The UI does not need big changes — it only needs to send the user to the login page when it receives a "session expired" response (this is normal behaviour).

There are two ways to do it. Please choose one.

--- Option 1: No new tools (simple, fast) ---

How it works:
- Today, a login token is valid for 20 minutes.
- We will make it shorter (for example 10 minutes).
- When the password is changed, we block the token renewal.
- So the other computers will stop working within a few minutes (maximum 10 minutes), and the user must log in again.

Good:
- No new tools or servers needed.
- We can build it quickly.
- No extra cost.

Not perfect:
- The logout is not instant. There is a small delay (up to 10 minutes) before the other computers are logged out.

--- Option 2: Add a new tool called Redis (instant) ---

How it works:
- We add a small fast memory server (Redis / AWS ElastiCache).
- When the password is changed, we mark the old sessions as invalid there.
- The other computers are logged out immediately.

Good:
- Logout is instant on all computers. This is the most secure option.

Not perfect:
- We need to set up and approve this new server.
- It takes a little more time and has a small running cost.

--- Our recommendation ---

If "a few minutes delay is acceptable", Option 1 is enough. Changing a password is not a frequent action, and the risk during those few minutes is very low.

If you need the logout to be "immediate" (for example for security or compliance reasons), then Option 2 (Redis) is the right choice.

Please let us know which option you prefer, and we will proceed.

Thank you,
Aditya