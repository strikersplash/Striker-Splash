"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadYearlySalesReport = exports.getYearlySalesData = exports.getSalesTrackingData = exports.getSalesReports = void 0;
const db_1 = require("../../config/db");
const getSalesReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period = "today" } = req.query;
        // Calculate date range based on period using Central Time for consistency
        let startDate;
        let endDate;
        // Get current date in Belize Time (UTC-6) - using manual offset due to timezone database issue
        const currentDateResult = yield (0, db_1.executeQuery)("SELECT (NOW() - interval '6 hours')::date as today");
        const todayStr = currentDateResult.rows[0].today
            .toISOString()
            .split("T")[0];
        switch (period) {
            case "week":
                // Start of this week (Monday) in Belize Time (UTC-6)
                const weekStartResult = yield (0, db_1.executeQuery)(`
          SELECT DATE_TRUNC('week', NOW() - interval '6 hours')::date as week_start
        `);
                startDate = weekStartResult.rows[0].week_start
                    .toISOString()
                    .split("T")[0];
                endDate = todayStr;
                break;
            case "month":
                // Start of this month in Belize Time (UTC-6)
                const monthStartResult = yield (0, db_1.executeQuery)(`
          SELECT DATE_TRUNC('month', NOW() - interval '6 hours')::date as month_start
        `);
                startDate = monthStartResult.rows[0].month_start
                    .toISOString()
                    .split("T")[0];
                endDate = todayStr;
                break;
            default: // 'today'
                startDate = todayStr;
                endDate = startDate;
        }
        console.log(`Sales report period: ${period}, from ${startDate} to ${endDate}`);
        // Get sales data by staff member
        const salesQuery = `
      SELECT 
        s.id as staff_id,
        CASE 
          WHEN s.active = false THEN CONCAT(COALESCE(s.name, s.username), ' (Account Deleted)')
          ELSE COALESCE(s.name, s.username)
        END as staff_name,
        s.role,
        COUNT(DISTINCT t.player_id) as customers_served,
        COUNT(t.id) as total_transactions,
        COALESCE(SUM(t.amount), 0) as total_revenue,
        COALESCE(SUM(t.kicks), 0) as total_kicks_sold
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id 
        AND (t.created_at - interval '6 hours')::date >= $1::date 
        AND (t.created_at - interval '6 hours')::date <= $2::date
        AND t.amount > 0
      WHERE s.role IN ('staff', 'admin', 'sales')
      GROUP BY s.id, s.name, s.username, s.role, s.active
      ORDER BY total_revenue DESC, staff_name ASC
    `;
        const salesResult = yield (0, db_1.executeQuery)(salesQuery, [startDate, endDate]);
        const salesData = salesResult.rows;
        // Calculate totals
        const totals = {
            totalCustomers: salesData.reduce((sum, row) => sum + parseInt(row.customers_served), 0),
            totalTransactions: salesData.reduce((sum, row) => sum + parseInt(row.total_transactions), 0),
            totalRevenue: salesData.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0),
            totalKicks: salesData.reduce((sum, row) => sum + parseInt(row.total_kicks_sold), 0),
        };
        // Get period display name
        let periodDisplay;
        switch (period) {
            case "week":
                periodDisplay = "This Week";
                break;
            case "month":
                periodDisplay = "This Month";
                break;
            default:
                periodDisplay = "Today";
        }
        res.render("admin/sales-reports", {
            title: "Staff Sales Reports",
            activePage: "sales-reports",
            salesData,
            totals,
            period,
            periodDisplay,
            startDate,
            endDate,
            user: req.session.user,
        });
    }
    catch (error) {
        console.error("Error generating sales reports:", error);
        req.flash("error_msg", "An error occurred while loading sales reports");
        res.redirect("/admin/dashboard");
    }
});
exports.getSalesReports = getSalesReports;
// API endpoint for real-time sales tracking data
const getSalesTrackingData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get current date in Belize Time (UTC-6) - using manual offset due to timezone database issue
        const currentDateResult = yield (0, db_1.executeQuery)("SELECT (NOW() - interval '6 hours')::date as today");
        const today = currentDateResult.rows[0].today;
        // Calculate this week's start (Sunday) using Belize timezone (UTC-6)
        const weekStartResult = yield (0, db_1.executeQuery)(`
      SELECT DATE_TRUNC('week', NOW() - interval '6 hours')::date as week_start
    `);
        const weekStart = weekStartResult.rows[0].week_start;
        // Calculate this month's start using Belize timezone (UTC-6)
        const monthStartResult = yield (0, db_1.executeQuery)(`
      SELECT DATE_TRUNC('month', NOW() - interval '6 hours')::date as month_start
    `);
        const monthStart = monthStartResult.rows[0].month_start;
        // Get sales data for all staff with day/week/month breakdowns
        const salesQuery = `
      SELECT 
        s.id as staff_id,
        CASE 
          WHEN s.active = false THEN CONCAT(COALESCE(s.name, s.username), ' (Account Deleted)')
          ELSE COALESCE(s.name, s.username)
        END as staff_name,
        s.role,
        -- Today's data (using Belize timezone UTC-6)
        COUNT(DISTINCT CASE WHEN (t.created_at - interval '6 hours')::date = $1::date AND t.amount > 0 THEN t.player_id END) as customers_today,
        COALESCE(SUM(CASE WHEN (t.created_at - interval '6 hours')::date = $1::date AND t.amount > 0 THEN t.amount END), 0) as revenue_today,
        -- This week's data (using Belize timezone UTC-6)
        COUNT(DISTINCT CASE WHEN (t.created_at - interval '6 hours')::date >= $2::date AND t.amount > 0 THEN t.player_id END) as customers_week,
        COALESCE(SUM(CASE WHEN (t.created_at - interval '6 hours')::date >= $2::date AND t.amount > 0 THEN t.amount END), 0) as revenue_week,
        -- This month's data (using Belize timezone UTC-6)
        COUNT(DISTINCT CASE WHEN (t.created_at - interval '6 hours')::date >= $3::date AND t.amount > 0 THEN t.player_id END) as customers_month,
        COALESCE(SUM(CASE WHEN (t.created_at - interval '6 hours')::date >= $3::date AND t.amount > 0 THEN t.amount END), 0) as revenue_month
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales')
      GROUP BY s.id, s.name, s.username, s.role, s.active
      ORDER BY revenue_today DESC, revenue_week DESC, staff_name ASC
    `;
        const salesResult = yield (0, db_1.executeQuery)(salesQuery, [
            today,
            weekStart,
            monthStart,
        ]);
        const salesData = salesResult.rows;
        // Calculate totals for each period
        const totals = {
            today: {
                customers: salesData.reduce((sum, row) => sum + parseInt(row.customers_today), 0),
                revenue: salesData.reduce((sum, row) => sum + parseFloat(row.revenue_today), 0),
            },
            week: {
                customers: salesData.reduce((sum, row) => sum + parseInt(row.customers_week), 0),
                revenue: salesData.reduce((sum, row) => sum + parseFloat(row.revenue_week), 0),
            },
            month: {
                customers: salesData.reduce((sum, row) => sum + parseInt(row.customers_month), 0),
                revenue: salesData.reduce((sum, row) => sum + parseFloat(row.revenue_month), 0),
            },
        };
        res.json({
            success: true,
            timestamp: Date.now(),
            salesData,
            totals,
            dates: {
                today,
                weekStart,
                monthStart,
            },
        });
    }
    catch (error) {
        console.error("Error getting sales tracking data:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while loading sales tracking data",
        });
    }
});
exports.getSalesTrackingData = getSalesTrackingData;
// Get yearly sales data for a specific year
const getYearlySalesData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year = new Date().getFullYear() } = req.query;
        const targetYear = parseInt(year);
        // Get sales data by staff member for the entire year with monthly breakdown
        const salesQuery = `
      SELECT 
        s.id as staff_id,
        CASE 
          WHEN s.active = false THEN CONCAT(COALESCE(s.name, s.username), ' (Account Deleted)')
          ELSE COALESCE(s.name, s.username)
        END as staff_name,
        s.role,
        -- Year totals
        COUNT(DISTINCT CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.player_id END) as customers_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.amount END), 0) as revenue_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.kicks END), 0) as kicks_year,
        COUNT(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN 1 END) as transactions_year,
        -- Monthly breakdown (Jan-Dec)
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 1 AND t.amount > 0 THEN t.amount END), 0) as jan_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 2 AND t.amount > 0 THEN t.amount END), 0) as feb_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 3 AND t.amount > 0 THEN t.amount END), 0) as mar_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 4 AND t.amount > 0 THEN t.amount END), 0) as apr_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 5 AND t.amount > 0 THEN t.amount END), 0) as may_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 6 AND t.amount > 0 THEN t.amount END), 0) as jun_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 7 AND t.amount > 0 THEN t.amount END), 0) as jul_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 8 AND t.amount > 0 THEN t.amount END), 0) as aug_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 9 AND t.amount > 0 THEN t.amount END), 0) as sep_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 10 AND t.amount > 0 THEN t.amount END), 0) as oct_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 11 AND t.amount > 0 THEN t.amount END), 0) as nov_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 12 AND t.amount > 0 THEN t.amount END), 0) as dec_revenue
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales')
      GROUP BY s.id, s.name, s.username, s.role, s.active
      ORDER BY revenue_year DESC, staff_name ASC
    `;
        const salesResult = yield (0, db_1.executeQuery)(salesQuery, [targetYear]);
        const salesData = salesResult.rows;
        // Calculate yearly totals
        const totals = {
            year: {
                customers: salesData.reduce((sum, row) => sum + parseInt(row.customers_year), 0),
                revenue: salesData.reduce((sum, row) => sum + parseFloat(row.revenue_year), 0),
                kicks: salesData.reduce((sum, row) => sum + parseInt(row.kicks_year), 0),
                transactions: salesData.reduce((sum, row) => sum + parseInt(row.transactions_year), 0),
            },
            monthly: {
                jan: salesData.reduce((sum, row) => sum + parseFloat(row.jan_revenue), 0),
                feb: salesData.reduce((sum, row) => sum + parseFloat(row.feb_revenue), 0),
                mar: salesData.reduce((sum, row) => sum + parseFloat(row.mar_revenue), 0),
                apr: salesData.reduce((sum, row) => sum + parseFloat(row.apr_revenue), 0),
                may: salesData.reduce((sum, row) => sum + parseFloat(row.may_revenue), 0),
                jun: salesData.reduce((sum, row) => sum + parseFloat(row.jun_revenue), 0),
                jul: salesData.reduce((sum, row) => sum + parseFloat(row.jul_revenue), 0),
                aug: salesData.reduce((sum, row) => sum + parseFloat(row.aug_revenue), 0),
                sep: salesData.reduce((sum, row) => sum + parseFloat(row.sep_revenue), 0),
                oct: salesData.reduce((sum, row) => sum + parseFloat(row.oct_revenue), 0),
                nov: salesData.reduce((sum, row) => sum + parseFloat(row.nov_revenue), 0),
                dec: salesData.reduce((sum, row) => sum + parseFloat(row.dec_revenue), 0),
            },
        };
        res.json({
            success: true,
            year: targetYear,
            salesData,
            totals,
        });
    }
    catch (error) {
        console.error("Error getting yearly sales data:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while loading yearly sales data",
        });
    }
});
exports.getYearlySalesData = getYearlySalesData;
// Download yearly sales report as CSV
const downloadYearlySalesReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year = new Date().getFullYear() } = req.query;
        const targetYear = parseInt(year);
        console.log(`Generating yearly sales CSV for year: ${targetYear}`);
        // Get the same data as the yearly API
        const salesQuery = `
      SELECT 
        s.id as staff_id,
        CASE 
          WHEN s.active = false THEN CONCAT(COALESCE(s.name, s.username), ' (Account Deleted)')
          ELSE COALESCE(s.name, s.username)
        END as staff_name,
        s.role,
        -- Year totals
        COUNT(DISTINCT CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.player_id END) as customers_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.amount END), 0) as revenue_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.kicks END), 0) as kicks_year,
        COUNT(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN 1 END) as transactions_year,
        -- Monthly breakdown (Jan-Dec)
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 1 AND t.amount > 0 THEN t.amount END), 0) as jan_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 2 AND t.amount > 0 THEN t.amount END), 0) as feb_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 3 AND t.amount > 0 THEN t.amount END), 0) as mar_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 4 AND t.amount > 0 THEN t.amount END), 0) as apr_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 5 AND t.amount > 0 THEN t.amount END), 0) as may_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 6 AND t.amount > 0 THEN t.amount END), 0) as jun_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 7 AND t.amount > 0 THEN t.amount END), 0) as jul_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 8 AND t.amount > 0 THEN t.amount END), 0) as aug_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 9 AND t.amount > 0 THEN t.amount END), 0) as sep_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 10 AND t.amount > 0 THEN t.amount END), 0) as oct_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 11 AND t.amount > 0 THEN t.amount END), 0) as nov_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 12 AND t.amount > 0 THEN t.amount END), 0) as dec_revenue
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales')
      GROUP BY s.id, s.name, s.username, s.role, s.active
      ORDER BY revenue_year DESC, staff_name ASC
    `;
        const salesResult = yield (0, db_1.executeQuery)(salesQuery, [targetYear]);
        const salesData = salesResult.rows;
        // Generate CSV content
        const csvHeaders = [
            "Staff Name",
            "Role",
            "Year Total Revenue",
            "Year Customers",
            "Year Transactions",
            "Year Kicks",
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        let csvContent = csvHeaders.join(",") + "\n";
        // Add data rows
        salesData.forEach((row) => {
            const csvRow = [
                `"${row.staff_name}"`,
                `"${row.role}"`,
                `"$${parseFloat(row.revenue_year).toFixed(2)}"`,
                `"${row.customers_year}"`,
                `"${row.transactions_year}"`,
                `"${row.kicks_year}"`,
                `"$${parseFloat(row.jan_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.feb_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.mar_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.apr_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.may_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.jun_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.jul_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.aug_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.sep_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.oct_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.nov_revenue).toFixed(2)}"`,
                `"$${parseFloat(row.dec_revenue).toFixed(2)}"`,
            ];
            csvContent += csvRow.join(",") + "\n";
        });
        // Add totals row
        const totalRevenue = salesData.reduce((sum, row) => sum + parseFloat(row.revenue_year), 0);
        const totalCustomers = salesData.reduce((sum, row) => sum + parseInt(row.customers_year), 0);
        const totalTransactions = salesData.reduce((sum, row) => sum + parseInt(row.transactions_year), 0);
        const totalKicks = salesData.reduce((sum, row) => sum + parseInt(row.kicks_year), 0);
        csvContent += "\n"; // Empty row
        const totalsRow = [
            '"TOTALS"',
            '""',
            `"$${totalRevenue.toFixed(2)}"`,
            `"${totalCustomers}"`,
            `"${totalTransactions}"`,
            `"${totalKicks}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.jan_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.feb_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.mar_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.apr_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.may_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.jun_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.jul_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.aug_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.sep_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.oct_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.nov_revenue), 0)
                .toFixed(2)}"`,
            `"$${salesData
                .reduce((sum, row) => sum + parseFloat(row.dec_revenue), 0)
                .toFixed(2)}"`,
        ];
        csvContent += totalsRow.join(",") + "\n";
        // Set response headers for CSV download
        const filename = `sales-report-yearly-${targetYear}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csvContent);
    }
    catch (error) {
        console.error("Error generating yearly sales CSV:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while generating the yearly sales report",
        });
    }
});
exports.downloadYearlySalesReport = downloadYearlySalesReport;
