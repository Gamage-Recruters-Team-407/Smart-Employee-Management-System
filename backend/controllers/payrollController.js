// backend/controllers/payrollController.js

import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';

// ─── MONTH HELPERS ─────────────────────────────────────────────────────────
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Normalize any month input the frontend may send into the schema's
 * month NAME + numeric year. Handles:
 *   - "2026-06"        (create, getAll)            -> { month: "June", year: 2026 }
 *   - "06" + "2026"    (summary route params)      -> { month: "June", year: 2026 }
 *   -  6   + 2026                                   -> { month: "June", year: 2026 }
 *   - "June" (+ year)  (already a name)            -> { month: "June", year }
 */
const normalizeMonthYear = (monthInput, yearInput) => {
  const parsedYear = yearInput != null && yearInput !== '' ? parseInt(yearInput, 10) : undefined;

  if (monthInput == null) return { month: undefined, year: parsedYear };

  const str = String(monthInput).trim();

  // "YYYY-MM"
  if (/^\d{4}-\d{1,2}$/.test(str)) {
    const [y, m] = str.split('-');
    return { month: MONTHS[parseInt(m, 10) - 1], year: parseInt(y, 10) };
  }

  // Numeric month ("6" or "06")
  if (/^\d{1,2}$/.test(str)) {
    const idx = parseInt(str, 10) - 1;
    return { month: MONTHS[idx], year: parsedYear };
  }

  // Already a month name
  const matched = MONTHS.find((m) => m.toLowerCase() === str.toLowerCase());
  return { month: matched || str, year: parsedYear };
};

const computeNet = ({ basicSalary = 0, allowances = 0, bonus = 0, deductions = 0, tax = 0, loans = 0 }) =>
  (basicSalary || 0) + (allowances || 0) + (bonus || 0)
  - (deductions || 0) - (tax || 0) - (loans || 0);

// ─── GET ALL PAYROLL RECORDS ──────────────────────────────────────────────
export const getPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const filter = {};

    if (month) {
      const norm = normalizeMonthYear(month, year);
      if (norm.month) filter.month = norm.month;
      if (norm.year) filter.year = norm.year;
    } else if (year) {
      filter.year = parseInt(year, 10);
    }
    if (employeeId) filter.employee = employeeId;

    const payrolls = await Payroll.find(filter)
      .populate('employee', 'firstName lastName email employeeId department designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: payrolls
    });
  } catch (error) {
    console.error('Get payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll records',
      error: error.message
    });
  }
};

// ─── GET SINGLE PAYROLL ────────────────────────────────────────────────────
export const getPayrollById = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id)
      .populate('employee', 'firstName lastName email employeeId department designation');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Get payroll by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll record',
      error: error.message
    });
  }
};

// ─── CREATE PAYROLL ────────────────────────────────────────────────────────
export const createPayroll = async (req, res) => {
  try {
    const { employeeId, month, year, allowances, deductions, loans, bonus, tax, notes } = req.body;

    // Employee must exist — basic salary is derived from the employee record
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const { month: monthName, year: resolvedYear } = normalizeMonthYear(month, year);
    if (!monthName || !resolvedYear) {
      return res.status(400).json({
        success: false,
        message: 'A valid month and year are required'
      });
    }

    // Prevent duplicate run for the same employee/month/year
    const existing = await Payroll.findOne({ employee: employeeId, month: monthName, year: resolvedYear });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Payroll already exists for ${employee.firstName} ${employee.lastName} (${monthName} ${resolvedYear})`
      });
    }

    const basicSalary = employee.salary || 0;
    const fields = {
      basicSalary,
      allowances: Number(allowances) || 0,
      deductions: Number(deductions) || 0,
      loans: Number(loans) || 0,
      bonus: Number(bonus) || 0,
      tax: Number(tax) || 0
    };

    const payroll = new Payroll({
      employee: employeeId,
      month: monthName,
      year: resolvedYear,
      ...fields,
      netSalary: computeNet(fields),
      notes: notes || '',
      status: 'Pending'
    });

    await payroll.save();
    await payroll.populate('employee', 'firstName lastName email employeeId department designation');

    res.status(201).json({
      success: true,
      message: 'Payroll created successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Create payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payroll record',
      error: error.message
    });
  }
};

// ─── UPDATE PAYROLL ────────────────────────────────────────────────────────
export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { basicSalary, allowances, deductions, loans, bonus, tax, status, notes } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    if (basicSalary !== undefined) payroll.basicSalary = Number(basicSalary) || 0;
    if (allowances !== undefined) payroll.allowances = Number(allowances) || 0;
    if (deductions !== undefined) payroll.deductions = Number(deductions) || 0;
    if (loans !== undefined) payroll.loans = Number(loans) || 0;
    if (bonus !== undefined) payroll.bonus = Number(bonus) || 0;
    if (tax !== undefined) payroll.tax = Number(tax) || 0;
    if (status) payroll.status = status;
    if (notes !== undefined) payroll.notes = notes;

    payroll.netSalary = computeNet(payroll);

    await payroll.save();
    await payroll.populate('employee', 'firstName lastName email employeeId department designation');

    res.status(200).json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payroll record',
      error: error.message
    });
  }
};

// ─── DELETE PAYROLL ────────────────────────────────────────────────────────
export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    await payroll.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Payroll deleted successfully'
    });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payroll record',
      error: error.message
    });
  }
};

// ─── GENERATE BULK PAYROLL ────────────────────────────────────────────────
// Frontend sends: { month: "2026-06", allowanceRate: 0.10, deductionRate: 0 }
// (rates already divided by 100 on the client). We apply them to each active
// employee's basic salary.
export const generateBulkPayroll = async (req, res) => {
  try {
    const { month, year, allowanceRate, deductionRate } = req.body;

    const { month: monthName, year: resolvedYear } = normalizeMonthYear(month, year);
    if (!monthName || !resolvedYear) {
      return res.status(400).json({
        success: false,
        message: 'A valid month and year are required'
      });
    }

    const aRate = Number(allowanceRate) || 0;
    const dRate = Number(deductionRate) || 0;

    const employees = await Employee.find({ status: 'Active' });
    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found to generate payroll for'
      });
    }

    const results = [];
    const errors = [];

    for (const employee of employees) {
      try {
        const existing = await Payroll.findOne({
          employee: employee._id,
          month: monthName,
          year: resolvedYear
        });
        if (existing) {
          errors.push({ employeeId: employee._id, error: 'Payroll already exists for this month' });
          continue;
        }

        const basicSalary = employee.salary || 0;
        const fields = {
          basicSalary,
          allowances: Math.round(basicSalary * aRate),
          deductions: Math.round(basicSalary * dRate),
          loans: 0,
          bonus: 0,
          tax: 0
        };

        const payroll = new Payroll({
          employee: employee._id,
          month: monthName,
          year: resolvedYear,
          ...fields,
          netSalary: computeNet(fields),
          status: 'Pending'
        });

        await payroll.save();
        results.push(payroll);
      } catch (err) {
        errors.push({ employeeId: employee._id, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk payroll generated: ${results.length} created, ${errors.length} skipped`,
      data: { created: results, errors }
    });
  } catch (error) {
    console.error('Bulk payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bulk payroll',
      error: error.message
    });
  }
};

// ─── GET PAYROLL SUMMARY ──────────────────────────────────────────────────
export const getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.params;

    const { month: monthName, year: resolvedYear } = normalizeMonthYear(month, year);
    if (!monthName || !resolvedYear) {
      return res.status(400).json({
        success: false,
        message: 'A valid month and year are required'
      });
    }

    const payrolls = await Payroll.find({ month: monthName, year: resolvedYear })
      .populate('employee', 'firstName lastName employeeId department');

    const sum = (key) => payrolls.reduce((acc, p) => acc + (p[key] || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        month: monthName,
        year: resolvedYear,
        totalEmployees: payrolls.length,
        totalBasicSalary: sum('basicSalary'),
        totalAllowances: sum('allowances'),
        totalDeductions: sum('deductions'),
        totalLoans: sum('loans'),
        totalTax: sum('tax'),
        totalNetSalary: sum('netSalary'),
        records: payrolls
      }
    });
  } catch (error) {
    console.error('Payroll summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll summary',
      error: error.message
    });
  }
};

// ─── GET PAYROLL EMPLOYEES ────────────────────────────────────────────────
export const getPayrollEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ status: 'Active' })
      .select('_id firstName lastName employeeId department designation salary');

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Get payroll employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees for payroll',
      error: error.message
    });
  }
};

// ─── GET ROLE BY USER ID ──────────────────────────────────────────────────
export const getRoleByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const employee = await Employee.findOne({ userId })
      .select('role designation department');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        role: employee.role,
        designation: employee.designation,
        department: employee.department
      }
    });
  } catch (error) {
    console.error('Get role by user ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role',
      error: error.message
    });
  }
};

// ─── GET PAYSLIP PDF ──────────────────────────────────────────────────────
export const getPayslipPDF = async (req, res) => {
  try {
    const { payrollId } = req.query;

    if (!payrollId) {
      return res.status(400).json({
        success: false,
        message: 'Payroll ID is required'
      });
    }

    const payroll = await Payroll.findById(payrollId)
      .populate('employee', 'firstName lastName employeeId department designation email');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payroll
    });
  } catch (error) {
    console.error('Get payslip PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payslip PDF',
      error: error.message
    });
  }
};