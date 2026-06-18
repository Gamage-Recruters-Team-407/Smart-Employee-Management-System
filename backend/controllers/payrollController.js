import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';

// ─── GET ALL PAYROLL RECORDS ──────────────────────────────────────────────
export const getPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const filter = {};
    
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year);
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
    const { employeeId, month, year, basicSalary, allowances, deductions, bonus, tax } = req.body;
    
    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if payroll already exists for this employee/month/year
    const existing = await Payroll.findOne({ employee: employeeId, month, year });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Payroll already exists for this employee and month'
      });
    }
    
    const netSalary = (basicSalary || 0) + (allowances || 0) + (bonus || 0) - (deductions || 0) - (tax || 0);
    
    const payroll = new Payroll({
      employee: employeeId,
      month,
      year,
      basicSalary: basicSalary || 0,
      allowances: allowances || 0,
      deductions: deductions || 0,
      bonus: bonus || 0,
      tax: tax || 0,
      netSalary,
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
    const { basicSalary, allowances, deductions, bonus, tax, status } = req.body;
    
    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }
    
    // Update fields
    if (basicSalary !== undefined) payroll.basicSalary = basicSalary;
    if (allowances !== undefined) payroll.allowances = allowances;
    if (deductions !== undefined) payroll.deductions = deductions;
    if (bonus !== undefined) payroll.bonus = bonus;
    if (tax !== undefined) payroll.tax = tax;
    if (status) payroll.status = status;
    
    // Recalculate net salary
    payroll.netSalary = (payroll.basicSalary || 0) + (payroll.allowances || 0) + (payroll.bonus || 0) - (payroll.deductions || 0) - (payroll.tax || 0);
    
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
export const generateBulkPayroll = async (req, res) => {
  try {
    const { month, year, employees } = req.body;
    
    if (!month || !year || !employees || !Array.isArray(employees)) {
      return res.status(400).json({
        success: false,
        message: 'Month, year, and employees array are required'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const empData of employees) {
      try {
        const { employeeId, basicSalary, allowances, deductions, bonus, tax } = empData;
        
        const employee = await Employee.findById(employeeId);
        if (!employee) {
          errors.push({ employeeId, error: 'Employee not found' });
          continue;
        }
        
        const existing = await Payroll.findOne({ employee: employeeId, month, year });
        if (existing) {
          errors.push({ employeeId, error: 'Payroll already exists for this month' });
          continue;
        }
        
        const netSalary = (basicSalary || 0) + (allowances || 0) + (bonus || 0) - (deductions || 0) - (tax || 0);
        
        const payroll = new Payroll({
          employee: employeeId,
          month,
          year,
          basicSalary: basicSalary || 0,
          allowances: allowances || 0,
          deductions: deductions || 0,
          bonus: bonus || 0,
          tax: tax || 0,
          netSalary,
          status: 'Pending'
        });
        
        await payroll.save();
        results.push(payroll);
      } catch (err) {
        errors.push({ employeeId: empData.employeeId, error: err.message });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Bulk payroll generated: ${results.length} created, ${errors.length} failed`,
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
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Month and year are required'
      });
    }
    
    const payrolls = await Payroll.find({ month, year: parseInt(year) })
      .populate('employee', 'firstName lastName employeeId department');
    
    const totalEmployees = payrolls.length;
    const totalBasicSalary = payrolls.reduce((sum, p) => sum + (p.basicSalary || 0), 0);
    const totalAllowances = payrolls.reduce((sum, p) => sum + (p.allowances || 0), 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + (p.deductions || 0), 0);
    const totalTax = payrolls.reduce((sum, p) => sum + (p.tax || 0), 0);
    const totalNetSalary = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
    
    res.status(200).json({
      success: true,
      data: {
        month,
        year: parseInt(year),
        totalEmployees,
        totalBasicSalary,
        totalAllowances,
        totalDeductions,
        totalTax,
        totalNetSalary,
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
      .select('_id firstName lastName employeeId department designation');
    
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
    
    // Generate PDF (you'll need to implement this function)
    // For now, return the payroll data
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