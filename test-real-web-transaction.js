const http = require("http");

async function testRealTransaction() {
  console.log(
    "🧪 Testing real transaction creation through the web interface...\n"
  );

  try {
    // Step 1: Login
    console.log("1. Attempting login...");
    const loginData = JSON.stringify({
      email: "test_staff@example.com",
      password: "password123",
    });

    const loginPromise = new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: 3000,
          path: "/auth/login",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(loginData),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data,
            });
          });
        }
      );

      req.on("error", reject);
      req.write(loginData);
      req.end();
    });

    const loginResponse = await loginPromise;
    console.log("   Login response status:", loginResponse.statusCode);

    if (loginResponse.statusCode === 200 || loginResponse.statusCode === 302) {
      console.log("   ✅ Login successful (or redirected)");

      // Try to get session cookie
      const setCookie = loginResponse.headers["set-cookie"];
      const sessionCookie = setCookie
        ? setCookie.find((c) => c.startsWith("connect.sid="))
        : null;

      if (sessionCookie) {
        console.log("   📝 Got session cookie");

        // Step 2: Try to check current database state first
        console.log("\n2. Checking database state before transaction...");
        const { Pool } = require("pg");
        const pool = new Pool({
          user: process.env.DB_USER || "striker_splash",
          host: process.env.DB_HOST || "localhost",
          database: process.env.DB_NAME || "striker_splash",
          password: process.env.DB_PASSWORD || "striker_splash",
          port: process.env.DB_PORT || 5432,
        });

        const beforeQuery = `SELECT MAX(id) as max_id FROM transactions`;
        const beforeResult = await pool.query(beforeQuery);
        const maxIdBefore = beforeResult.rows[0].max_id;
        console.log("   📊 Max transaction ID before:", maxIdBefore);

        // Step 3: Make purchase API call
        console.log("\n3. Making purchase API call...");
        const purchaseData = JSON.stringify({
          playerId: 5, // Lil Johnny
          kicks: 3,
          amount: 3,
        });

        const purchasePromise = new Promise((resolve, reject) => {
          const req = http.request(
            {
              hostname: "localhost",
              port: 3000,
              path: "/cashier/api/purchase-kicks",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(purchaseData),
                Cookie: sessionCookie.split(";")[0],
              },
            },
            (res) => {
              let data = "";
              res.on("data", (chunk) => (data += chunk));
              res.on("end", () => {
                resolve({
                  statusCode: res.statusCode,
                  body: data,
                });
              });
            }
          );

          req.on("error", reject);
          req.write(purchaseData);
          req.end();
        });

        const purchaseResponse = await purchasePromise;
        console.log(
          "   Purchase API response status:",
          purchaseResponse.statusCode
        );
        console.log("   Purchase API response:", purchaseResponse.body);

        // Step 4: Check database state after
        console.log("\n4. Checking database state after transaction...");
        const afterResult = await pool.query(beforeQuery);
        const maxIdAfter = afterResult.rows[0].max_id;
        console.log("   📊 Max transaction ID after:", maxIdAfter);

        if (maxIdAfter > maxIdBefore) {
          console.log("   ✅ New transaction was created! ID:", maxIdAfter);

          // Get the new transaction details
          const newTxQuery = `
                        SELECT t.id, t.created_at, t.amount, t.kicks,
                               t.created_at AT TIME ZONE 'America/Belize' as belize_time,
                               (t.created_at AT TIME ZONE 'America/Belize')::date as belize_date,
                               p.name as player_name, s.name as staff_name
                        FROM transactions t
                        LEFT JOIN players p ON t.player_id = p.id
                        LEFT JOIN staff s ON t.staff_id = s.id
                        WHERE t.id = $1
                    `;

          const newTxResult = await pool.query(newTxQuery, [maxIdAfter]);
          if (newTxResult.rows.length > 0) {
            const tx = newTxResult.rows[0];
            console.log("   📝 Transaction details:");
            console.log(`      - Player: ${tx.player_name}`);
            console.log(`      - Staff: ${tx.staff_name}`);
            console.log(`      - Amount: $${tx.amount}, Kicks: ${tx.kicks}`);
            console.log(`      - Created: ${tx.belize_time} (Belize)`);
            console.log(
              `      - Date: ${tx.belize_date.toISOString().split("T")[0]}`
            );

            // Check if it appears in today's sales tracking
            console.log("\n5. Checking if it appears in sales tracking...");
            const todayDate = tx.belize_date.toISOString().split("T")[0];
            const salesQuery = `
                            SELECT 
                                s.id as staff_id,
                                COALESCE(s.name, s.username) as staff_name,
                                COALESCE(SUM(CASE WHEN (t.created_at AT TIME ZONE 'America/Belize')::date = $1::date AND t.amount > 0 THEN t.amount END), 0) as revenue_today
                            FROM staff s
                            LEFT JOIN transactions t ON s.id = t.staff_id
                            WHERE s.role IN ('staff', 'admin', 'sales')
                              AND s.id = $2
                            GROUP BY s.id, s.name, s.username
                        `;

            const salesResult = await pool.query(salesQuery, [
              todayDate,
              tx.staff_name ? null : 1,
            ]);
            console.log("   Sales tracking result:", salesResult.rows);
          }
        } else {
          console.log("   ❌ No new transaction was created");
        }

        await pool.end();
      } else {
        console.log("   ❌ No session cookie received");
      }
    } else {
      console.log("   ❌ Login failed");
      console.log("   Response:", loginResponse.body);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testRealTransaction();
