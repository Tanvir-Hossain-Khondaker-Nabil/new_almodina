<?php

return [
    // Page titles
    'create_title' => 'Create New Purchase Return',
    'create_subtitle' => 'Process return for purchased items',
    'edit_title' => 'Edit Purchase Return',
    'list_title' => 'Purchase Returns',
    'list_subtitle' => 'Manage and track purchase returns',
    'return_details' => 'Return Details',
    'select_purchase' => 'Select Purchase',
    'select_purchase_placeholder' => 'Select a purchase to return',
    'select_purchase_help' => 'Select a purchase to view items available for return',

    // Navigation & Actions
    'back_to_list' => 'Back to List',
    'back_to_purchases' => 'Back to Purchases',
    'create_return' => 'Create Purchase Return',
    'create_new' => 'Create Return',
    'edit_return' => 'Edit Return',
    'delete_return' => 'Delete Return',
    'view_return' => 'View Return',
    'print_return' => 'Print Return Slip',
    'cancel' => 'Cancel',
    'save' => 'Save Changes',
    'update' => 'Update Return',
    'creating' => 'Creating Return...',
    'updating' => 'Updating Return...',
    'deleting' => 'Deleting...',
    'view_full_details' => 'View Full Details',
    'complete_refund' => 'Complete Refund',
    'export' => 'Export',
    'print' => 'Print',
    'item_total' => 'Item Total',

    // Status & Types
    'all_statuses' => 'All Statuses',
    'all_types' => 'All Types',
    'status_pending' => 'Pending',
    'status_approved' => 'Approved',
    'status_rejected' => 'Rejected',
    'status_processed' => 'Processed',
    'status_completed' => 'Completed',
    'status_cancelled' => 'Cancelled',

    'type_money_back' => 'Money Back',
    'type_product_replacement' => 'Product Replacement',
    'type_adjustment' => 'Adjustment',

    'payment_cash' => 'Cash',
    'payment_card' => 'Card',
    'payment_mobile_banking' => 'Mobile Banking',
    'payment_bank_transfer' => 'Bank Transfer',
    'payment_adjust_to_advance' => 'Adjust to Supplier Advance',
    'payment_credit' => 'Credit',

    // Form Labels
    'return_type' => 'Return Type',
    'return_date' => 'Return Date',
    'reason' => 'Reason for Return',
    'reason_placeholder' => 'Explain why you are returning these items...',
    'notes' => 'Additional Notes',
    'notes_placeholder' => 'Any additional information...',
    'payment_type' => 'Payment Type',
    'refund_amount' => 'Refund Amount',
    'shadow_refund_amount' => 'Shadow Refund Amount',
    'refund_method' => 'Refund Method',
    'reference_no' => 'Reference Number',
    'attachments' => 'Attachments',

    // Descriptions
    'money_back_desc' => 'Refund amount to supplier',
    'replacement_desc' => 'Replace with other products',
    'adjustment_desc' => 'Adjust against future purchases',
    'full_refund' => 'Full refund of return value',

    // Items Section
    'items_to_return' => 'Items to Return',
    'replacement_products' => 'Replacement Products',
    'add_replacement' => 'Add Replacement',
    'search_products' => 'Search replacement products...',
    'no_replacement_added' => 'No replacement products added',
    'click_add_replacement' => 'Click "Add Replacement" to add products',
    'no_items_available' => 'No items available for return',

    // Item Fields
    'product' => 'Product',
    'variant' => 'Variant',
    'quantity' => 'Quantity',
    'return_quantity' => 'Return Qty',
    'unit_price' => 'Unit Price',
    'shadow_unit_price' => 'Shadow Unit Price',
    'total_price' => 'Total Price',
    'sale_price' => 'Sale Price',
    'shadow_sale_price' => 'Shadow Sale Price',
    'batch_no' => 'Batch No',
    'expiry_date' => 'Expiry Date',
    'available_stock' => 'Available Stock',
    'max_returnable' => 'Max Returnable',
    'reason_short' => 'Why return?',

    // Calculations
    'total_return_value' => 'Total Return Value',
    'total_replacement_value' => 'Total Replacement Value',
    'return_summary' => 'Return Summary',
    'value_difference' => 'Value Difference',
    'return_value' => 'Return Value',
    'replacement_value' => 'Replacement Value',
    'net_difference' => 'Net Difference',
    'total_items' => 'Total Items to Return',
    'total_quantity' => 'Total Quantity',
    'subtotal' => 'Subtotal',
    'tax' => 'Tax',
    'shipping' => 'Shipping',
    'grand_total' => 'Grand Total',
    'shadow_total' => 'Shadow Total',
    'total_returnable' => 'Total Returnable',
    'shadow_return' => 'Shadow Return',
    'shadow_refunded' => 'Shadow Refunded',

    // Purchase Info
    'purchase_info' => 'Purchase Information',
    'purchase_no' => 'Purchase No',
    'return_no' => 'Return No',
    'purchase_date' => 'Purchase Date',
    'supplier' => 'Supplier',
    'warehouse' => 'Warehouse',
    'supplier_balance' => 'Supplier Balance',
    'available_advance' => 'Available Advance',
    'purchased' => 'Purchased',
    'available' => 'Available',

    // Actions & Buttons
    'set_full_amount' => 'Set Full Amount',
    'add_item' => 'Add Item',
    'remove_item' => 'Remove Item',
    'clear_all' => 'Clear All',
    'calculate' => 'Calculate',
    'preview' => 'Preview',
    'submit_for_approval' => 'Submit for Approval',
    'approve_return' => 'Approve Return',
    'reject_return' => 'Reject Return',
    'process_return' => 'Process Return',
    'complete_return' => 'Complete Return',

    // Messages & Alerts
    'select_purchase_first' => 'Please select a purchase first from the purchase list',
    'select_at_least_one_item' => 'Please select at least one item to return',
    'enter_reason' => 'Please provide a reason for the return',
    'select_payment_type' => 'Please select payment type for refund',
    'add_replacement_products' => 'Please add replacement products',
    'quantity_exceeds_available' => 'Return quantity exceeds available stock',
    'invalid_quantity' => 'Please enter a valid quantity',
    'invalid_amount' => 'Please enter a valid amount',
    'refund_exceeds_limit' => 'Refund amount cannot exceed return value',

    // Success Messages
    'return_created' => 'Purchase return created successfully',
    'return_updated' => 'Purchase return updated successfully',
    'return_deleted' => 'Purchase return deleted successfully',
    'return_approved' => 'Purchase return approved',
    'return_rejected' => 'Purchase return rejected',
    'return_processed' => 'Purchase return processed successfully',
    'return_completed' => 'Purchase return completed',

    // Confirmation Messages
    'confirm_delete' => 'Confirm Delete',
    'confirm_approve' => 'Are you sure you want to approve this return?',
    'confirm_complete' => 'Are you sure you want to complete this return?',
    'confirm_process' => 'Process this return?',
    'confirm_reject' => 'Reject this purchase return?',

    // Error Messages
    'delete_error' => 'Failed to delete purchase return',
    'approve_error' => 'Failed to approve purchase return',
    'complete_error' => 'Failed to complete purchase return',

    // Return List
    'date' => 'Date',
    'supplier_name' => 'Supplier Name',
    'total_amount' => 'Total Amount',
    'amount' => 'Amount',
    'refunded' => 'Refunded',
    'balance' => 'Balance',
    'created_by' => 'Created By',
    'type' => 'Type',
    'actions' => 'Actions',
    'no_returns' => 'No purchase returns found',
    'no_returns_found' => 'No purchase returns found',
    'no_returns_description' => 'Create a new purchase return or adjust your filters',
    'create_first_return' => 'Create Your First Return',
    'filter_by_supplier' => 'Filter by Supplier',
    'filter_by_date' => 'Filter by Date',
    'filter_by_status' => 'Filter by Status',
    'filter_by_type' => 'Filter by Type',
    'search_placeholder' => 'Search by return no, supplier...',

    // Filters
    'filters' => 'Filters',
    'reset_filters' => 'Reset',
    'search' => 'Search',
    'date' => 'Date',
    'status' => 'Status',

    // Summary Cards
    'total_returns' => 'Total Returns',
    'pending' => 'Pending',
    'replacement' => 'Replacement',
    'money_back' => 'Money Back',

    // Table
    'returns_list' => 'Purchase Returns List',
    'showing' => 'Showing',
    'of' => 'of',
    'approved' => 'Approved',
    'completed' => 'Completed',
    'cancelled' => 'Cancelled',

    // Modal
    'delete_warning' => 'Are you sure you want to delete this purchase return? This action cannot be undone.',

    // Modal Titles
    'add_return_item' => 'Add Return Item',
    'select_product' => 'Select Product',
    'select_replacement' => 'Select Replacement Product',
    'view_details' => 'View Return Details',
    'approval_confirmation' => 'Approval Confirmation',
    'rejection_confirmation' => 'Rejection Confirmation',

    // Financial Terms
    'credit_note' => 'Credit Note',
    'debit_note' => 'Debit Note',
    'amount_payable' => 'Amount Payable',
    'amount_receivable' => 'Amount Receivable',
    'settlement' => 'Settlement',
    'partial_refund' => 'Partial Refund',
    'full_refund' => 'Full Refund',

    // Transaction Details
    'transaction_id' => 'Transaction ID',
    'bank_name' => 'Bank Name',
    'account_number' => 'Account Number',
    'mobile_wallet' => 'Mobile Wallet',
    'transaction_date' => 'Transaction Date',
    'receipt_no' => 'Receipt No',

    // Additional
    'remarks' => 'Remarks',
    'attachment' => 'Attachment',
    'download_attachment' => 'Download Attachment',
    'view_attachment' => 'View Attachment',
    'history' => 'Return History',
    'audit_log' => 'Audit Log',
    'created_at' => 'Created At',
    'updated_at' => 'Updated At',

    // Validation Messages
    'required_field' => 'This field is required',
    'numeric_field' => 'Please enter a valid number',
    'min_quantity' => 'Minimum quantity is 1',
    'max_quantity' => 'Quantity exceeds available stock',
    'valid_date' => 'Please enter a valid date',
    'future_date_not_allowed' => 'Future date is not allowed',
    'past_date_not_allowed' => 'Past date is not allowed',

    // Status Messages
    'pending_approval' => 'Pending Approval',
    'awaiting_processing' => 'Awaiting Processing',
    'refund_pending' => 'Refund Pending',
    'replacement_pending' => 'Replacement Pending',
    'partially_refunded' => 'Partially Refunded',
    'fully_refunded' => 'Fully Refunded',

    // Reports & Analytics
    'return_report' => 'Return Report',
    'monthly_returns' => 'Monthly Returns',
    'supplier_returns' => 'Supplier Returns',
    'product_returns' => 'Product Returns',
    'return_rate' => 'Return Rate',
    'total_returns' => 'Total Returns',
    'average_return' => 'Average Return',
    'highest_return' => 'Highest Return',
    'lowest_return' => 'Lowest Return',
    'difference' => 'Value Difference',

    // Amount Details
    'amount_details' => 'Amount Details',
    'reason_notes' => 'Reason & Notes',
    'value_comparison' => 'Value Comparison',
    'important_notes' => 'Important Notes',
    'delete_warning' => 'Are you sure you want to delete this purchase return? This action cannot be undone.',
    'confirm_complete_refund' => 'Are you sure you want to complete this refund? This will process the payment.',
    'confirm_complete_replacement' => 'Are you sure you want to complete this product replacement? This will finalize the replacement process.',
    'cannot_create_return_due_to_stock' => 'Cannot create return due to stock issues',
    'stock_availability_issues' => 'Stock Availability Issues',
    'stock_issues_description' => 'Some items exceed available stock. Check the stock availability section.',
    'stock_availability_check' => 'Stock Availability Check',
    'adjust_quantities_before_submitting' => 'Please adjust quantities before submitting.',
    'show_quantity' => 'Show Quantity',
    
    // Additional missing terms found in components:
    'shadow_price' => 'Shadow Price',
    'shadow_total_price' => 'Shadow Total Price',
    'item_total' => 'Item Total',
    'max' => 'Max',
    'in_stock' => 'In Stock',
    'already_returned' => 'Already Returned',
    'shadow' => 'Shadow',
    'unit_type' => 'Unit Type',
    'default_unit' => 'Default Unit',
    'product_code' => 'Product Code',
    'select_quantity' => 'Select quantity for each item',
    'approval_process' => 'Approval Process',
    'requires_approval' => 'Returns require approval before processing',
    'stock_decreased' => 'Stock will be decreased upon approval',
    'financial_adjustments' => 'Financial adjustments happen after completion',
    'stock_impact' => 'Stock Impact',
    'returned_items_removed' => 'Returned items will be removed from inventory',
    'replacement_items_added' => 'Replacement items will be added to inventory',
    'net_financial_difference' => 'Net financial difference will be settled',
    'we_pay_to_supplier' => 'We pay to supplier',
    'we_receive_from_supplier' => 'We receive from supplier',
    'values_are_equal' => 'Values are equal',
    'no_payment_adjustment_needed' => 'No payment adjustment needed',
    'replacement_value_exceeds' => 'Replacement value exceeds return value',
    'return_value_exceeds' => 'Return value exceeds replacement value',
    'this_amount_will_be' => 'This amount will be',
    'adjusted_to_supplier_advance' => 'adjusted to supplier advance',
    'refunded_via' => 'refunded via',
    'unit' => 'Unit',
    'available' => 'Available',
    'cost' => 'Cost',
    'sku' => 'SKU',
    'purchased_quantity' => 'Purchased Quantity',
    'return_qty' => 'Return Qty',
    'refund_amount' => 'Refund Amount',
    'item_total' => 'Item Total',
    'reason_for_returning_item' => 'Reason for returning this item',
    'reason_example' => 'e.g., Damaged, Wrong item',
    
    // Status-related missing terms:
    'pending' => 'Pending',
    'approved' => 'Approved',
    'completed' => 'Completed',
    'cancelled' => 'Cancelled',
    
    // Missing button labels:
    'create_purchase_return' => 'Create Purchase Return',
    'complete_replacement' => 'Complete Replacement',
    'view' => 'View',
    'expand' => 'Expand',
    'collapse' => 'Collapse',
    
    // Modal-related missing terms:
    'close' => 'Close',
    'confirm' => 'Confirm',
    
    // Filter-related missing terms:
    'filter_by' => 'Filter by',
    'clear_all' => 'Clear All',
    'apply_filters' => 'Apply Filters',
    
    // Column headers missing:
    'created_by' => 'Created By',
    'user_type' => 'User Type',
    'general_user' => 'General User',
    'shadow_user' => 'Shadow User',
    'system' => 'System',
    
    // Amount display terms:
    'total' => 'Total',
    'subtotal' => 'Subtotal',
    'net_difference' => 'Net Difference',
    'refunded_amount' => 'Refunded Amount',
    'shadow_refunded_amount' => 'Shadow Refunded Amount',
    'total_return_amount' => 'Total Return Amount',
    'shadow_return_amount' => 'Shadow Return Amount',
    
    // Date and time:
    'today' => 'Today',
    'yesterday' => 'Yesterday',
    'this_week' => 'This Week',
    'this_month' => 'This Month',
    'last_month' => 'Last Month',
    'custom_range' => 'Custom Range',
    
    // Stock related:
    'stock_available' => 'Stock Available',
    'stock_unavailable' => 'Stock Unavailable',
    'insufficient_stock' => 'Insufficient Stock',
    'available_quantity' => 'Available Quantity',
    'return_quantity' => 'Return Quantity',
    'max_return_quantity' => 'Max Return Quantity',
    
    // Replacement product terms:
    'add_product' => 'Add Product',
    'remove_product' => 'Remove Product',
    'update_product' => 'Update Product',
    'product_details' => 'Product Details',
    'variant_details' => 'Variant Details',
    
    // Additional form labels:
    'select_date' => 'Select Date',
    'enter_reason' => 'Enter Reason',
    'additional_notes' => 'Additional Notes',
    'select_payment_method' => 'Select Payment Method',
    
    // Error messages:
    'form_validation_error' => 'Please fix the errors in the form',
    'network_error' => 'Network error. Please try again.',
    'server_error' => 'Server error. Please contact support.',
    'unauthorized_action' => 'You are not authorized to perform this action.',
    
    // Success messages:
    'operation_successful' => 'Operation successful',
    'data_saved' => 'Data saved successfully',
    'changes_saved' => 'Changes saved successfully',
    
    // Loading states:
    'loading' => 'Loading...',
    'processing' => 'Processing...',
    'saving' => 'Saving...',
    'deleting' => 'Deleting...',
    'updating' => 'Updating...',
    
    // Search and filter:
    'search_results' => 'Search Results',
    'no_results_found' => 'No results found',
    'try_different_keywords' => 'Try different keywords',
    'clear_search' => 'Clear Search',
    
    // Actions in expanded row:
    'view_full_details' => 'View Full Details',
    'edit_details' => 'Edit Details',
    'print_details' => 'Print Details',
    'export_details' => 'Export Details',
    
    // Product information:
    'product_name' => 'Product Name',
    'variant_name' => 'Variant Name',
    'unit_cost' => 'Unit Cost',
    'selling_price' => 'Selling Price',
    'purchase_price' => 'Purchase Price',
    
    // Warehouse information:
    'warehouse_name' => 'Warehouse Name',
    'warehouse_location' => 'Warehouse Location',
    
    // Supplier information:
    'supplier_name' => 'Supplier Name',
    'supplier_company' => 'Supplier Company',
    'supplier_contact' => 'Supplier Contact',
    
    // Payment information:
    'payment_status' => 'Payment Status',
    'paid' => 'Paid',
    'partial' => 'Partial',
    'unpaid' => 'Unpaid',
    'payment_method' => 'Payment Method',
    'transaction_reference' => 'Transaction Reference',
    
    // Return process steps:
    'step_1_select_purchase' => '1. Select Purchase',
    'step_2_select_items' => '2. Select Items',
    'step_3_choose_type' => '3. Choose Return Type',
    'step_4_review' => '4. Review & Submit',
    
    // Additional notes and remarks:
    'remarks' => 'Remarks',
    'internal_notes' => 'Internal Notes',
    'customer_notes' => 'Customer Notes',
    
    // Audit and tracking:
    'created_on' => 'Created On',
    'last_updated' => 'Last Updated',
    'updated_by' => 'Updated By',
    'action_by' => 'Action By',
    
    // File and attachment:
    'attachment' => 'Attachment',
    'file_name' => 'File Name',
    'file_size' => 'File Size',
    'upload_date' => 'Upload Date',
    
    // Status indicators:
    'active' => 'Active',
    'inactive' => 'Inactive',
    'enabled' => 'Enabled',
    'disabled' => 'Disabled',
    'visible' => 'Visible',
    'hidden' => 'Hidden',
];