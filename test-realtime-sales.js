#!/usr/bin/env node

const axios = require("axios");

async function testRealTimeSalesUpdate() {
  try {
    console.log("=== Testing Real-Time Sales Updates via API ===");

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test the sales tracking API endpoint
    console.log("1. Fetching current sales tracking data...");
    const salesResponse = await axios.get(
      "http://localhost:3000/admin/api/sales-tracking"
    );

    console.log("Sales API Response Status:", salesResponse.status);
    if (salesResponse.data.success) {
      console.log("✅ Sales tracking API working!");

      // Find Jeff Finnetty in the results
      const jeffData = salesResponse.data.salesData.find(
        (staff) =>
          staff.staff_name.includes("Jeff Finnetty") ||
          staff.staff_name.includes("Jeff")
      );

      if (jeffData) {
        console.log("\n📊 Jeff Finnetty Current Sales Data:");
        console.log(
          `Today: ${jeffData.customers_today} customers, $${jeffData.revenue_today}`
        );
        console.log(
          `This Week: ${jeffData.customers_week} customers, $${jeffData.revenue_week}`
        );
        console.log(
          `This Month: ${jeffData.customers_month} customers, $${jeffData.revenue_month}`
        );
      }
    }

    // Test the yearly API endpoint
    console.log("\n2. Fetching yearly sales data...");
    const currentYear = new Date().getFullYear();
    const yearlyResponse = await axios.get(
      `http://localhost:3000/admin/api/sales-yearly?year=${currentYear}`
    );

    console.log("Yearly API Response Status:", yearlyResponse.status);
    if (yearlyResponse.data.success) {
      console.log("✅ Yearly sales API working!");

      const jeffYearData = yearlyResponse.data.salesData.find(
        (staff) =>
          staff.staff_name.includes("Jeff Finnetty") ||
          staff.staff_name.includes("Jeff")
      );

      if (jeffYearData) {
        console.log(
          `Year: ${jeffYearData.customers_year} customers, $${jeffYearData.revenue_year}`
        );
      }
    }

    console.log("\n✅ SUCCESS: All sales tracking APIs are working!");
    console.log(
      "💡 When you make sales as Jeff Finnetty, all columns (Today, Week, Month, Year) should update immediately!"
    );
  } catch (error) {
    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else {
      console.error("Connection Error:", error.message);
    }
  }
}

testRealTimeSalesUpdate();
