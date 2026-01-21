<?php

return [
    // AddPurchase Component
    'create_purchase' => 'Create New Purchase',
    'create_shadow_purchase' => 'Create Purchase (Shadow Mode)',
    'create_subtitle' => 'Add products to purchase order with real and shadow pricing',
    'create_shadow_subtitle' => 'Add products to purchase order with shadow pricing',
    'back_to_list' => 'Back to List',
    
    // Form Labels
    'supplier' => 'Supplier',
    'warehouse' => 'Warehouse',
    'purchase_date' => 'Purchase Date',
    'notes' => 'Notes',
    'additional_notes' => 'Additional notes...',
    'add_products' => 'Add Products',
    'search_products' => 'Search products by name or code...',
    'no_products_found' => 'No products found matching',
    'uncategorized' => 'Uncategorized',
    'brand' => 'Brand',
    'not_available' => 'N/A',
    'download_pdf' => 'Download',
    
    // Payment Information
    'payment_information' => 'Payment Information',
    'shadow_payment_information' => 'Shadow Payment Information',
    'payment_status' => 'Payment Status',
    'paid_amount' => 'Paid Amount',
    'total_amount' => 'Total Amount',
    'due_amount' => 'Due Amount',
    'unpaid' => 'Unpaid',
    'partial' => 'Partial',
    'paid' => 'Paid',
    'adjust_amount' => 'Adjust Amount From Advance',
    'adjust_amount_desc' => 'Use available advance balance to adjust the payment',
    'contact_person' => 'Contact Person',
    'partial_amount' => 'Partial Amount',
    'partial_amount_desc' => 'Enter the amount to be paid partially',
    'allow_partial_payment' => 'Allow Partial Payment',
    'adjust_from_advance' => 'Adjust from Advance',
    'advance_active' => 'Advance Adjustment Active',
    'advance_adjustment' => 'Advance Adjustment',
    'available_advance' => 'Available Advance',
    'advance_adjustment_enabled' => 'Advance adjustment is enabled. The due amount will be adjusted accordingly.',
    'will_be_deducted' => ' will be deducted from the due amount.',
    'note' => 'Note ', 
    'up_to ' => ' up to ',
    'amount_paid_from_advance' => ' amount will be paid from the advance balance.',
    'shadow_paid' => 'Shadow Paid Amount',
    'shadow_due' => 'Shadow Due Amount',
    'remaining_advance' => 'Remaining Advance',
    'partial_payment_enabled' => 'Partial payment is enabled. Please enter the amount to be paid.',
    'advance_will_be_deducted' => ' amount will be deducted from your available advance balance. ',
    'manual' => 'Manual',
    'selected_items' => 'Selected Items',


    // Item Management
    // 'selected_items' => 'Selected Items',
    'quantity' => 'Quantity',
    'unit_price' => 'Unit Price',
    'shadow_unit_price' => 'Shadow Unit Price',
    'sale_price' => 'Sale Price',
    'shadow_sale_price' => 'Shadow Sale Price',
    'total_price' => 'Total Price',
    'real_total' => 'Real Total',
    'real_sale_price' => 'Real Sale Price',
    'active_total' => 'Active Total',
    'active_sale_price' => 'Active Sale Price',
    'remove' => 'Remove',
    
    // Amount Sections
    'real_amounts' => 'Real Amounts',
    'shadow_amounts' => 'Shadow Amounts',
    'active_amounts' => 'Active Amounts',
    
    // Buttons
    'create_purchase_btn' => 'Create Purchase',
    'create_shadow_purchase_btn' => 'Create Shadow Purchase',
    'creating_purchase' => 'Creating Purchase...',
    'cancel' => 'Cancel',
    
    // Validation Messages
    'select_supplier' => 'Please select a supplier',
    'select_warehouse' => 'Please select a warehouse',
    'add_products_validation' => 'Please add at least one product',
    'valid_prices_validation' => 'Please ensure all items have valid quantities and prices greater than 0',
    
    // Empty States
    'no_items_added' => 'No items added yet',
    'search_add_products' => 'Search and add products above',
    'enter_shadow_prices' => 'Remember to enter shadow prices for all items',
    
    // PurchaseList Component
    'purchase_management' => 'Purchase Management',
    'manage_purchases' => 'Manage your product purchases',
    'view_purchase_data' => 'View purchase data',
    'search_purchases' => 'Search purchases...',
    'all_status' => 'All Status',
    'pending' => 'Pending',
    'completed' => 'Completed',
    'cancelled' => 'Cancelled',
    'new_purchase' => 'New Purchase',
    
    // Table Headers
    'purchase_details' => 'Purchase Details',
    'supplier_warehouse' => 'Supplier & Warehouse',
    'items_amount' => 'Items & Amount',
    'actions' => 'Actions',
    'purchase_number' => 'Purchase #',
    'units' => 'units',
    'items' => 'items',
    'shadow_total' => 'Shadow Total',
    'needs_approval' => 'Needs Approval',
    'shadow_purchase' => 'Shadow Purchase',
    
    // Status Badges
    'paid_status' => 'Paid',
    'pending_approval' => 'Pending',
    
    // Action Buttons
    'details' => 'Details',
    'payment' => 'Payment',
    'approve' => 'Approve',
    'delete' => 'Delete',
    
    // Filter Labels
    'active_filters' => 'Active Filters',
    'clear_all' => 'Clear All',
    'clear_filters' => 'Clear Filters',
    
    // Empty States
    'no_purchases_found' => 'No purchases found!',
    'no_matching_purchases' => 'No purchases match your filters',
    'adjust_search_criteria' => 'Try adjusting your search criteria',
    'create_first_purchase' => 'Get started by creating your first purchase',
    
    // PurchaseShow Component
    'purchase_details_title' => 'Purchase Details',
    'purchase_number_label' => 'Purchase Number: ',
    'purchase_date_label' => 'Purchase Date',
    'supplier_information' => 'Supplier Information',
    'warehouse_information' => 'Warehouse Information',
    'name' => 'Name',
    'company' => 'Company',
    'shadow' => 'Shadow',
    'phone' => 'Phone',
    'return' => 'Return',
    'email' => 'Email',
    'code' => 'Code',
    'address' => 'Address',
    'payment_options_summary' => 'Payment Options & Summary',
    'purchase_status' => 'Purchase Status',
    'created' => 'Created',
    'last_updated' => 'Last Updated',
    'amount_summary' => 'Amount Summary',
    'purchase_items' => 'Purchase Items',
    'total_units_purchased' => 'Total units purchased',
    'product' => 'Product',
    'variant' => 'Variant',
    'totals' => 'Totals',
    'no_items_found' => 'No items found in this purchase',
    
    // Print/Export
    'print' => 'Print',
    'export' => 'Export',
    
    // Payment Modal
    'update_payment' => 'Update Payment',
    'close' => 'Close',
    'save_changes' => 'Save Changes',
    
    // Approve Modal
    'approve_purchase' => 'Approve Purchase',
    'enter_valid_prices' => 'Please enter valid prices for all items',
    'approve_btn' => 'Approve',
    
    // Currency
    'currency' => '৳',
];