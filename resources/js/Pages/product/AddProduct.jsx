import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageHeader from "../../components/PageHeader";
import { useForm } from "@inertiajs/react";
import { Trash, X, Plus, Factory, Package, Image as ImageIcon, Ruler, AlertCircle, Hash } from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "../../hooks/useTranslation";

export default function AddProduct({ category, update, brand, attributes, errors: serverErrors }) {
  const { t, locale } = useTranslation();

  const [variants, setVariants] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [productType, setProductType] = useState("regular");
  const [variantAttributeSelector, setVariantAttributeSelector] = useState(null);
  const [unitConversions, setUnitConversions] = useState({});
  const [lastGeneratedCode, setLastGeneratedCode] = useState(null);

  const [unitTypes, setUnitTypes] = useState([
    { value: 'piece', label: 'Piece', description: 'Individual items' },
    { value: 'weight', label: 'Weight', description: 'Measured by weight (kg, gram, ton)' },
    { value: 'volume', label: 'Volume', description: 'Measured by volume (liter, ml)' },
    { value: 'length', label: 'Length', description: 'Measured by length (meter, cm)' },
  ]);

  const [unitsByType, setUnitsByType] = useState({
    piece: ['piece', 'dozen', 'box'],
    weight: ['ton', 'kg', 'gram', 'pound'],
    volume: ['liter', 'ml'],
    length: ['meter', 'cm', 'mm']
  });

  const [minSaleUnits, setMinSaleUnits] = useState({
    weight: ['ton', 'kg', 'gram'],
    volume: ['liter', 'ml'],
    length: ['meter', 'cm', 'mm'],
    piece: ['piece']
  });

  // ✅ photo states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const existingPhotoUrl = useMemo(() => {
    if (!update?.photo) return null;
    return `/storage/${update.photo}`;
  }, [update]);

  // Initialize form with product_type ALWAYS set
  const productForm = useForm({
    id: update ? update.id : "",
    product_name: update ? update.name : "",
    brand_id: update ? update.brand_id : "",
    category_id: update ? update.category_id : "",
    product_no: update ? update.product_no : "",
    description: update ? update.description : "",
    product_type: "regular",
    in_house_cost: update ? update.in_house_cost || 0 : 0,
    in_house_shadow_cost: update ? update.in_house_shadow_cost || 0 : 0,
    in_house_sale_price: update ? update.in_house_sale_price || 0 : 0,
    in_house_shadow_sale_price: update ? update.in_house_shadow_sale_price || 0 : 0,
    in_house_initial_stock: update ? update.in_house_initial_stock || 0 : 0,

    // ✅ ইউনিট ফিল্ডস
    unit_type: update ? update.unit_type || 'piece' : 'piece',
    default_unit: update ? update.default_unit || 'piece' : 'piece',
    is_fraction_allowed: update ? update.is_fraction_allowed || false : false,
    min_sale_unit: update ? update.min_sale_unit || '' : '',

    variants: [],
    photo: null,
  });

  // ✅ প্রোডাক্ট কোড জেনারেট করার ফাংশন (প্রোডাক্ট নাম থেকে)
  const generateProductCode = useCallback((productName) => {
    if (update) return; // এডিট মোডে জেনারেট করবেন না
    
    if (!productName || productName.trim() === '') {
      return '';
    }
    
    // প্রোডাক্ট নাম থেকে কোড তৈরি করুন
    const name = productName.trim();
    
    // 1. প্রথম শব্দের প্রথম ৩ অক্ষর নিন
    const words = name.split(' ');
    let code = '';
    
    if (words.length === 1) {
      // এক শব্দ হলে প্রথম ৩-৬ অক্ষর নিন
      code = words[0].substring(0, 6).toUpperCase();
    } else {
      // একাধিক শব্দ হলে প্রথম ২ শব্দের প্রথম অক্ষর নিন
      code = words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
      
      // তৃতীয় শব্দ থেকে আরও ২ অক্ষর যোগ করুন (যদি থাকে)
      if (words.length >= 3) {
        code += words[2].substring(0, 2).toUpperCase();
      }
      
      // সর্বোচ্চ ৬ অক্ষর রাখুন
      code = code.substring(0, 6);
    }
    
    // 2. একটি র‍্যান্ডম সংখ্যা যোগ করুন (শুধু সাবমিশনের সময়)
    const timestamp = Date.now().toString().slice(-4);
    
    // 3. ফাইনাল কোড তৈরি করুন
    const finalCode = `${code}-${timestamp}`;
    setLastGeneratedCode(finalCode);
    
    return finalCode;
  }, [update]);

  // ✅ প্রোডাক্ট নাম পরিবর্তন হলে অটো কোড জেনারেট করুন
  const handleProductNameChange = (value) => {
    productForm.setData("product_name", value);
    
    // নতুন প্রোডাক্ট হলে অটো জেনারেট করুন
    if (!update) {
      const generatedCode = generateProductCode(value);
      if (generatedCode) {
        productForm.setData("product_no", generatedCode);
      }
    }
    
    // Clear error
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.product_name;
      return newErrors;
    });
  };

  useEffect(() => {
    // Handle server errors
    if (serverErrors) {
      setFormErrors(serverErrors);
    }

    // Load unit conversions if passed in props
    if (update?.unit_conversions) {
      setUnitConversions(update.unit_conversions);
    }

    // Process categories
    if (Array.isArray(category)) {
      setCategories(category);
    } else if (category && typeof category === "object") {
      if (category.data && Array.isArray(category.data)) {
        setCategories(category.data);
      } else {
        setCategories(Object.entries(category).map(([id, name]) => ({ id: Number(id), name })));
      }
    } else {
      setCategories([]);
    }

    // Process brands
    if (Array.isArray(brand)) {
      setBrands(brand);
    } else if (brand && typeof brand === "object") {
      if (brand.data && Array.isArray(brand.data)) {
        setBrands(brand.data);
      } else {
        setBrands(Object.entries(brand).map(([id, name]) => ({ id: Number(id), name })));
      }
    } else {
      setBrands([]);
    }

    // Process attributes
    if (attributes && Array.isArray(attributes)) {
      setAvailableAttributes(attributes);
    } else if (attributes && attributes.data && Array.isArray(attributes.data)) {
      setAvailableAttributes(attributes.data);
    }

    // CRITICAL FIX: ALWAYS ensure product_type is set
    const initialProductType = update?.product_type || "regular";

    // Set both state and form data
    setProductType(initialProductType);
    
    // Update form data immediately
    productForm.setData("product_type", initialProductType);

    // Update min sale unit based on unit type
    if (update?.unit_type) {
      const defaultMinUnit = unitsByType[update.unit_type]?.[1] || unitsByType[update.unit_type]?.[0] || '';
      if (!update.min_sale_unit && productForm.data.min_sale_unit === '') {
        productForm.setData('min_sale_unit', defaultMinUnit);
      }
    }
  }, [category, brand, attributes, update, serverErrors, productForm, unitsByType]);

  // ✅ ইউনিট টাইপ চেঞ্জ হলে
  const handleUnitTypeChange = (unitType) => {
    const newUnits = unitsByType[unitType] || ['piece'];
    const newDefaultUnit = newUnits[0] || 'piece';
    const newMinSaleUnit = minSaleUnits[unitType]?.[1] || minSaleUnits[unitType]?.[0] || newDefaultUnit;

    productForm.setData({
      unit_type: unitType,
      default_unit: newDefaultUnit,
      min_sale_unit: newMinSaleUnit,
      is_fraction_allowed: unitType !== 'piece'
    });

    // Clear related errors
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.unit_type;
      delete newErrors.default_unit;
      delete newErrors.min_sale_unit;
      delete newErrors.is_fraction_allowed;
      return newErrors;
    });
  };

  // ✅ ডিফল্ট ইউনিট চেঞ্জ হলে
  const handleDefaultUnitChange = (defaultUnit) => {
    productForm.setData('default_unit', defaultUnit);

    // Min sale unit should not be larger than default unit
    const unitType = productForm.data.unit_type;
    const units = unitsByType[unitType] || [];
    const defaultIndex = units.indexOf(defaultUnit);

    if (defaultIndex !== -1) {
      const minUnits = units.slice(defaultIndex); // Only units equal or smaller
      setMinSaleUnits(prev => ({
        ...prev,
        [unitType]: minUnits
      }));

      // Adjust min sale unit if needed
      const currentMinUnit = productForm.data.min_sale_unit || '';
      if (!minUnits.includes(currentMinUnit)) {
        productForm.setData('min_sale_unit', minUnits[0] || '');
      }
    }

    // Clear error
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.default_unit;
      return newErrors;
    });
  };

  // ✅ Min sale unit change
  const handleMinSaleUnitChange = (minUnit) => {
    productForm.setData('min_sale_unit', minUnit);
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.min_sale_unit;
      return newErrors;
    });
  };

  // ✅ photo change
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    productForm.setData("photo", file);

    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }

    // Clear error
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.photo;
      return newErrors;
    });
  };

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleVariantAttributeSelect = (variantIndex, attributeCode, value, checked) => {
    setVariants((prev) => {
      const updated = [...prev];
      const variant = updated[variantIndex];
      if (!variant.attribute_values) variant.attribute_values = {};

      if (checked) variant.attribute_values[attributeCode] = value;
      else delete variant.attribute_values[attributeCode];

      return updated;
    });
  };

  const openVariantAttributeSelector = (variantIndex) => setVariantAttributeSelector(variantIndex);
  const closeVariantAttributeSelector = () => setVariantAttributeSelector(null);

  const handleProductTypeChange = (type) => {
    // Update both state and form data immediately
    setProductType(type);
    productForm.setData("product_type", type);

    if (type === "regular") {
      productForm.setData({
        in_house_cost: 0,
        in_house_shadow_cost: 0,
        in_house_sale_price: 0,
        in_house_shadow_sale_price: 0,
        in_house_initial_stock: 0,
      });

      setFormErrors((prev) => {
        const ne = { ...prev };
        delete ne.in_house_cost;
        delete ne.in_house_shadow_cost;
        delete ne.in_house_sale_price;
        delete ne.in_house_shadow_sale_price;
        delete ne.in_house_initial_stock;
        return ne;
      });
    }

    // Clear product_type error
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.product_type;
      return newErrors;
    });
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: null,
        attribute_values: {},
      },
    ]);
  };

  const handleDeleteVariant = (index) => {
    if (variants.length > 1) {
      const updated = [...variants];
      updated.splice(index, 1);
      setVariants(updated);
    }
  };

  const handleClearVariantAttributes = (index) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[index].attribute_values = {};
      return updated;
    });
  };

  // ✅ ম্যানুয়ালি কোড জেনারেট করার ফাংশন
  const handleManualGenerateCode = () => {
    if (!update && productForm.data.product_name) {
      const generatedCode = generateProductCode(productForm.data.product_name);
      if (generatedCode) {
        productForm.setData("product_no", generatedCode);
        toast.success(t("product.code_generated", "Product code generated successfully!"));
      }
    }
  };

  const formSubmit = (e) => {
    e.preventDefault();

    // CRITICAL FIX: Ensure product_type is always set before submission
    if (!productForm.data.product_type) {
      productForm.setData("product_type", productType || "regular");
    }

    // Validate product type
    if (!productForm.data.product_type || (productForm.data.product_type !== "regular" && productForm.data.product_type !== "in_house")) {
      toast.error(t("product.select_product_type", "Please select a valid product type"));
      return;
    }

    // Validate product name
    if (!productForm.data.product_name || productForm.data.product_name.trim() === '') {
      toast.error(t("product.product_name_required", "Product name is required"));
      return;
    }

    // Validate variants
    if (variants.length === 0) {
      toast.error(t("product.at_least_one_variant", "Please add at least one variant"));
      return;
    }

    // Validate variant attributes
    const hasInvalidVariants = variants.some(variant =>
      !variant.attribute_values || typeof variant.attribute_values !== 'object'
    );

    if (hasInvalidVariants) {
      toast.error(t("product.invalid_variant_attributes", "Please check variant attributes"));
      return;
    }

    // ✅ ফাইনাল কোড জেনারেট করুন (প্রোডাক্ট নাম থেকে)
    if (!update && productForm.data.product_name && (!productForm.data.product_no || productForm.data.product_no === '')) {
      const finalCode = generateProductCode(productForm.data.product_name);
      if (finalCode) {
        productForm.setData("product_no", finalCode);
      }
    }

    const url = update ? route("product.update.post") : route("product.add.post");

    // ✅ Put variants into form state
    const variantsData = variants.map((v) => ({
      id: v.id,
      attribute_values: v.attribute_values || {},
    }));

    productForm.setData("variants", variantsData);

    // Final check: Ensure product_type is included
    const finalFormData = {
      ...productForm.data,
      product_type: productForm.data.product_type || productType || "regular"
    };

    // Clear all errors before submission
    setFormErrors({});

    // ✅ Submit as FormData automatically (photo is File)
    productForm.post(url, {
      data: finalFormData,
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        toast.success(update
          ? t("product.product_updated_success", "Product updated successfully!")
          : t("product.product_added_success", "Product added successfully!")
        );

        if (!update) {
          productForm.reset();
          setVariants([{ attribute_values: {} }]);
          setProductType("regular");
          setPhotoFile(null);
          setPhotoPreview(null);
          setFormErrors({});
          setLastGeneratedCode(null);
        }
      },
      onError: (errors) => {
        // Set form errors from server
        if (errors && typeof errors === 'object') {
          setFormErrors(errors);
        }

        // Show general error message
        const errorMessage = errors?.message ||
          errors?.error ||
          t("product.something_went_wrong", "Something went wrong. Please check the form and try again!");

        toast.error(errorMessage);

        // If there are validation errors, scroll to first error
        if (errors && Object.keys(errors).length > 0) {
          const firstErrorField = Object.keys(errors)[0];
          const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
          }
        }
      },
    });
  };

  // keep variants in sync
  useEffect(() => {
    productForm.setData("variants", variants);
  }, [variants]);

  // Load editing data
  useEffect(() => {
    if (update) {
      const updateData = {
        id: update.id || "",
        product_name: update.name || "",
        brand_id: update.brand_id || "",
        category_id: update.category_id || "",
        product_no: update.product_no || "",
        description: update.description || "",
        product_type: update.product_type || "regular",
        in_house_cost: update.in_house_cost || 0,
        in_house_shadow_cost: update.in_house_shadow_cost || 0,
        in_house_sale_price: update.in_house_sale_price || 0,
        in_house_shadow_sale_price: update.in_house_shadow_sale_price || 0,
        in_house_initial_stock: update.in_house_initial_stock || 0,
        photo: null,
        unit_type: update.unit_type || 'piece',
        default_unit: update.default_unit || 'piece',
        is_fraction_allowed: update.is_fraction_allowed || false,
        min_sale_unit: update.min_sale_unit || '',
      };

      productForm.setData(updateData);
      setProductType(update.product_type || "regular");

      if (update.variants?.length > 0) {
        setVariants(update.variants.map((v) => ({
          id: v.id || null,
          attribute_values: v.attribute_values || {},
        })));
      } else {
        setVariants([{ attribute_values: {} }]);
      }

      // reset new preview when opening edit
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      setVariants([{ attribute_values: {} }]);

      // ALWAYS set product_type to "regular" for new products
      const newProductData = {
        product_type: "regular",
        unit_type: 'piece',
        default_unit: 'piece',
        is_fraction_allowed: false,
        min_sale_unit: '',
      };

      productForm.setData(newProductData);
      setProductType("regular");
      
      // নতুন প্রোডাক্টের জন্য ডিফল্ট কোড জেনারেট করুন
      const defaultCode = `PROD-${Date.now().toString().slice(-6)}`;
      productForm.setData("product_no", defaultCode);
      setLastGeneratedCode(defaultCode);
    }
  }, [update]);

  // Helper function to safely convert to uppercase
  const safeUpperCase = (value) => {
    if (!value) return '';
    return String(value).toUpperCase();
  };

  const previewSrc = photoPreview || existingPhotoUrl;

  // Render error message helper
  const renderError = (fieldName) => {
    if (formErrors[fieldName]) {
      return (
        <div className="flex items-center gap-1 mt-1 text-error text-sm">
          <AlertCircle size={14} />
          <span>{Array.isArray(formErrors[fieldName]) ? formErrors[fieldName][0] : formErrors[fieldName]}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-box p-5 ${locale === "bn" ? "bangla-font" : ""}`}>
      <PageHeader
        title={update ? t("product.update_title", "Update Product") : t("product.from_title", "Add New Product")}
        subtitle={t("product.subtitle", "Add or update product with variants")}
      />

      {/* Display general form errors */}
      {formErrors.message && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={20} />
          <span>{formErrors.message}</span>
        </div>
      )}

      {/* Display product_type error specifically */}
      {formErrors.product_type && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={20} />
          <span>Product Type Error: {Array.isArray(formErrors.product_type) ? formErrors.product_type[0] : formErrors.product_type}</span>
        </div>
      )}

      <form onSubmit={formSubmit}>
        {/* ✅ PHOTO SECTION */}
        <div className="mb-6 border border-base-300 rounded-box p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon size={18} />
            <h3 className="font-semibold">{t("product.photo", "Product Photo")}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <input
                type="file"
                name="photo"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className={`file-input file-input-bordered w-full ${formErrors.photo ? "file-input-error" : ""}`}
                onChange={handlePhotoChange}
              />
              {renderError('photo')}
              <p className="text-xs text-gray-500 mt-2">
                {t("product.photo_tip", "PNG/JPG/WEBP, max 5MB")}
              </p>
            </div>

            <div className="border border-base-300 rounded-box p-3 bg-base-100">
              <div className="text-sm font-medium mb-2">{t("product.preview", "Preview")}</div>
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="preview"
                  className="w-full max-h-56 object-contain rounded"
                />
              ) : (
                <div className="text-sm text-gray-500 italic">
                  {t("product.no_photo_selected", "No photo selected")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ ইউনিট সেটিংস সেকশন */}
        <div className="mb-6 border border-base-300 rounded-box p-4">
          <div className="flex items-center gap-2 mb-4">
            <Ruler size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">{t("product.unit_settings", "Unit Settings")}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Unit Type Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">{t("product.unit_type", "Unit Type")} *</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {unitTypes.map((unitType) => (
                  <label
                    key={unitType.value}
                    className={`flex flex-col p-3 border rounded-lg cursor-pointer ${productForm.data.unit_type === unitType.value
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-primary/50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="unit_type"
                        value={unitType.value}
                        checked={productForm.data.unit_type === unitType.value}
                        onChange={(e) => handleUnitTypeChange(e.target.value)}
                        className="radio radio-primary radio-sm"
                      />
                      <span className="font-medium">{unitType.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{unitType.description}</span>
                  </label>
                ))}
              </div>
              {renderError('unit_type')}
            </div>

            {/* Default Unit Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">{t("product.default_unit", "Default Purchase Unit")} *</span>
              </label>
              <select
                name="default_unit"
                className={`select select-bordered ${formErrors.default_unit ? 'select-error' : ''}`}
                value={productForm.data.default_unit}
                onChange={(e) => handleDefaultUnitChange(e.target.value)}
              >
                {unitsByType[productForm.data.unit_type]?.map(unit => (
                  <option key={unit} value={unit}>
                    {unit.toUpperCase()}
                  </option>
                ))}
              </select>
              {renderError('default_unit')}
              <div className="text-xs text-gray-500 mt-1">
                {t("product.default_unit_help", "Default unit for purchasing this product")}
              </div>
            </div>
          </div>

          {/* Additional Unit Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Minimum Sale Unit */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  {t("product.min_sale_unit", "Minimum Sale Unit")}
                  {(productForm.data.unit_type === 'weight' ||
                    productForm.data.unit_type === 'volume' ||
                    productForm.data.unit_type === 'length') && ' *'}
                </span>
              </label>
              <select
                name="min_sale_unit"
                className={`select select-bordered ${formErrors.min_sale_unit ? 'select-error' : ''}`}
                value={productForm.data.min_sale_unit || ''}
                onChange={(e) => handleMinSaleUnitChange(e.target.value)}
                disabled={productForm.data.unit_type === 'piece'}
              >
                <option value="">{t("product.select_min_sale_unit", "-- Select --")}</option>
                {minSaleUnits[productForm.data.unit_type]?.map(unit => (
                  <option key={unit} value={unit}>
                    {unit.toUpperCase()}
                  </option>
                ))}
              </select>
              {renderError('min_sale_unit')}
              <div className="text-xs text-gray-500 mt-1">
                {productForm.data.unit_type === 'piece'
                  ? t("product.min_sale_unit_piece_help", "For piece products, minimum sale unit is always 'piece'")
                  : t("product.min_sale_unit_help", "Smallest unit that can be sold. Cannot be larger than purchase unit")}
              </div>
            </div>

            {/* Allow Fractions */}
            <div className="form-control">
              <div className="flex items-center gap-3 mt-6">
                <input
                  type="checkbox"
                  name="is_fraction_allowed"
                  className="checkbox checkbox-primary"
                  checked={productForm.data.is_fraction_allowed || false}
                  onChange={(e) => {
                    productForm.setData('is_fraction_allowed', e.target.checked);
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.is_fraction_allowed;
                      return newErrors;
                    });
                  }}
                  disabled={productForm.data.unit_type === 'piece'}
                />
                <div>
                  <div className="font-medium">{t("product.allow_fractions", "Allow Fractional Sales")}</div>
                  <div className="text-sm text-gray-500">
                    {productForm.data.unit_type === 'piece'
                      ? t("product.fractions_piece_help", "Not applicable for piece products")
                      : t("product.fractions_help", "Allow decimal quantities (e.g., 1.5 kg, 0.75 liter)")}
                  </div>
                </div>
              </div>
              {renderError('is_fraction_allowed')}
            </div>
          </div>

          {/* Unit Conversion Info */}
          {productForm.data.unit_type !== 'piece' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">
                {t("product.unit_conversion_info", "Unit Conversion Information")}
              </div>
              <div className="text-sm text-blue-700">
                {productForm.data.unit_type === 'weight' && (
                  <span>1 Ton = 1000 Kg, 1 Kg = 1000 Gram, 1 Pound = 0.453592 Kg</span>
                )}
                {productForm.data.unit_type === 'volume' && (
                  <span>1 Liter = 1000 ml</span>
                )}
                {productForm.data.unit_type === 'length' && (
                  <span>1 Meter = 100 cm = 1000 mm</span>
                )}
                <div className="mt-1">
                  {t("product.sale_note", "You can purchase in")} <strong>{safeUpperCase(productForm.data.default_unit)}</strong>
                  {t("product.and_sell_in", " and sell in")} <strong>{safeUpperCase(productForm.data.min_sale_unit) || safeUpperCase(productForm.data.default_unit)}</strong>
                  {t("product.or_smaller", " or smaller units")}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Type Selection - FIXED */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            {t("product.product_type", "Product Type")} *
          </h3>
          {renderError('product_type')}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              className={`card cursor-pointer border-2 ${productType === "regular"
                  ? "border-primary bg-[#1e4d2b] text-white"
                  : "border-base-300 hover:border-primary/50"
                }`}
            >
              <div className="card-body p-4">
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="product_type"
                    value="regular"
                    checked={productType === "regular"}
                    onChange={(e) => handleProductTypeChange(e.target.value)}
                    className="radio radio-primary mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Package size={20} className="text-primary" />
                      <h4 className="font-semibold">{t("product.regular_product", "Regular Product")}</h4>
                    </div>
                    <p className="text-sm text-gray-300 mt-2">
                      {t("product.regular_desc", "Purchase from supplier, needs stock management through purchase orders")}
                    </p>
                  </div>
                </div>
              </div>
            </label>

            {/* <label
              className={`card cursor-pointer border-2 ${productType === "in_house"
                  ? "border-warning bg-warning/5"
                  : "border-base-300 hover:border-warning/50"
                }`}
            >
              <div className="card-body p-4">
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="product_type"
                    value="in_house"
                    checked={productType === "in_house"}
                    onChange={(e) => handleProductTypeChange(e.target.value)}
                    className="radio radio-warning mt-1"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Factory size={20} className="text-warning" />
                      <h4 className="font-semibold text-warning">
                        {t("product.in_house_product", "In-House Production")}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {t("product.in_house_desc", "Internally produced, auto-stock management in In-House warehouse")}
                    </p>
                  </div>
                </div>
              </div>
            </label> */}
          </div>
        </div>

        {/* Product Basic Information */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              {t("product.from_product_name", "Product Name")}*
            </legend>
            <input
              type="text"
              name="product_name"
              className={`input ${formErrors.product_name ? "input-error" : ""}`}
              value={productForm.data.product_name || ''}
              onChange={(e) => handleProductNameChange(e.target.value)}
              placeholder={t("product.enter_product_name", "Enter product name (product code will auto-generate)")}
              autoFocus
            />
            {renderError('product_name')}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              <div className="flex items-center justify-between">
                <span>{t("product.from_product_code", "Product Code")}*</span>
                {!update && (
                  <button
                    type="button"
                    className="btn btn-xs btn-outline flex items-center gap-1"
                    onClick={handleManualGenerateCode}
                  >
                    <Hash size={12} />
                    {t("product.regenerate", "Re-generate")}
                  </button>
                )}
              </div>
            </legend>
            <input
              type="text"
              name="product_no"
              className={`input ${formErrors.product_no ? "input-error" : ""}`}
              value={productForm.data.product_no || ''}
              onChange={(e) => {
                productForm.setData("product_no", e.target.value);
                setFormErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.product_no;
                  return newErrors;
                });
              }}
              placeholder={t("product.code_auto_generate", "Product code will auto-generate from product name")}
              readOnly={!update} // শুধুমাত্র এডিট মোডে এডিট করা যাবে
            />
            {renderError('product_no')}
            <div className="text-xs text-gray-500 mt-1">
              {update 
                ? t("product.code_editable_info", "You can edit the product code in edit mode")
                : t("product.code_auto_info", "Code auto-generates from product name. Click 'Re-generate' for new code")
              }
              {lastGeneratedCode && (
                <div className="mt-1 text-blue-600">
                  {t("product.last_generated", "Last generated:")} {lastGeneratedCode}
                </div>
              )}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("product.from_category", "Category")}*</legend>
              <select
                name="category_id"
                value={productForm.data.category_id || ''}
                className={`select ${formErrors.category_id ? "select-error" : ""}`}
                onChange={(e) => {
                  productForm.setData("category_id", e.target.value);
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.category_id;
                    return newErrors;
                  });
                }}
              >
                <option value="">{t("product.pick_category", "--Pick a category--")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {renderError('category_id')}
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">{t("product.from_brand", "Brand")}</legend>
              <select
                name="brand_id"
                value={productForm.data.brand_id || ''}
                className={`select ${formErrors.brand_id ? "select-error" : ""}`}
                onChange={(e) => {
                  productForm.setData("brand_id", e.target.value);
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.brand_id;
                    return newErrors;
                  });
                }}
              >
                <option value="">{t("product.pick_brand", "--Pick a brand--")}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {renderError('brand_id')}
            </fieldset>
          </div>

          <fieldset className="fieldset col-span-2">
            <legend className="fieldset-legend">{t("product.from_description", "Description")}</legend>
            <textarea
              name="description"
              className="textarea"
              rows="3"
              value={productForm.data.description || ''}
              onChange={(e) => {
                productForm.setData("description", e.target.value);
                setFormErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors.description;
                  return newErrors;
                });
              }}
              placeholder={t("product.enter_description", "Enter product description")}
            />
            {renderError('description')}
          </fieldset>
        </div>

        {/* In-House settings */}
        {productType === "in_house" && (
          <div className="border border-warning rounded-box p-4 mb-6 bg-warning/5">
            <h3 className="text-lg font-semibold text-warning mb-4 flex items-center gap-2">
              <Factory size={20} />
              {t("product.in_house_settings", "In-House Production Settings")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("product.production_cost", "Production Cost")} *</span>
                </label>
                <input
                  type="number"
                  name="in_house_cost"
                  min="0"
                  step="0.01"
                  className={`input input-bordered ${formErrors.in_house_cost ? "input-error" : ""}`}
                  value={productForm.data.in_house_cost || 0}
                  onChange={(e) => {
                    productForm.setData("in_house_cost", parseFloat(e.target.value) || 0);
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.in_house_cost;
                      return newErrors;
                    });
                  }}
                  required
                />
                {renderError('in_house_cost')}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("product.shadow_production_cost", "Shadow Production Cost")} *</span>
                </label>
                <input
                  type="number"
                  name="in_house_shadow_cost"
                  min="0"
                  step="0.01"
                  className={`input input-bordered ${formErrors.in_house_shadow_cost ? "input-error" : ""}`}
                  value={productForm.data.in_house_shadow_cost || 0}
                  onChange={(e) => {
                    productForm.setData("in_house_shadow_cost", parseFloat(e.target.value) || 0);
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.in_house_shadow_cost;
                      return newErrors;
                    });
                  }}
                  required
                />
                {renderError('in_house_shadow_cost')}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("product.sale_price", "Sale Price")} *</span>
                </label>
                <input
                  type="number"
                  name="in_house_sale_price"
                  min="0"
                  step="0.01"
                  className={`input input-bordered ${formErrors.in_house_sale_price ? "input-error" : ""}`}
                  value={productForm.data.in_house_sale_price || 0}
                  onChange={(e) => {
                    productForm.setData("in_house_sale_price", parseFloat(e.target.value) || 0);
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.in_house_sale_price;
                      return newErrors;
                    });
                  }}
                  required
                />
                {renderError('in_house_sale_price')}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("product.shadow_sale_price", "Shadow Sale Price")} *</span>
                </label>
                <input
                  type="number"
                  name="in_house_shadow_sale_price"
                  min="0"
                  step="0.01"
                  className={`input input-bordered ${formErrors.in_house_shadow_sale_price ? "input-error" : ""}`}
                  value={productForm.data.in_house_shadow_sale_price || 0}
                  onChange={(e) => {
                    productForm.setData("in_house_shadow_sale_price", parseFloat(e.target.value) || 0);
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.in_house_shadow_sale_price;
                      return newErrors;
                    });
                  }}
                  required
                />
                {renderError('in_house_shadow_sale_price')}
              </div>

              <div className="form-control md:col-span-2 lg:col-span-1">
                <label className="label">
                  <span className="label-text">{t("product.initial_stock", "Initial Stock Quantity")} *</span>
                </label>
                <input
                  type="number"
                  name="in_house_initial_stock"
                  min="0"
                  className={`input input-bordered ${formErrors.in_house_initial_stock ? "input-error" : ""}`}
                  value={productForm.data.in_house_initial_stock || 0}
                  onChange={(e) => {
                    productForm.setData("in_house_initial_stock", parseInt(e.target.value) || 0);
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.in_house_initial_stock;
                      return newErrors;
                    });
                  }}
                  required
                />
                {renderError('in_house_initial_stock')}
              </div>
            </div>

            {/* In-house ইউনিট সেটিংস */}
            <div className="mt-4 pt-4 border-t border-warning/30">
              <h4 className="font-semibold text-warning mb-3 flex items-center gap-2">
                <Ruler size={16} />
                {t("product.in_house_unit_settings", "In-House Production Unit Settings")}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("product.production_unit", "Production Unit")}</span>
                  </label>
                  <div className="input input-bordered py-3 bg-gray-50">
                    {safeUpperCase(productForm.data.default_unit)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t("product.in_house_unit_help", "Production will be recorded in this unit")}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("product.sale_unit", "Sale Unit")}</span>
                  </label>
                  <div className="input input-bordered py-3 bg-gray-50">
                    {safeUpperCase(productForm.data.min_sale_unit) || safeUpperCase(productForm.data.default_unit)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t("product.in_house_sale_unit_help", "Customers can purchase in this unit")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Variants Section */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {t("product.product_variants", "Product Variants")}
              <span className="badge badge-primary badge-sm ml-2">{variants.length}</span>
            </h3>

            <button type="button" className="btn btn-sm btn-outline" onClick={handleAddVariant}>
              <Plus size={14} />
              {t("product.add_variant", "Add Variant")}
            </button>
          </div>

          {formErrors.variants && (
            <div className="alert alert-error mb-4">
              <AlertCircle size={20} />
              <span>{Array.isArray(formErrors.variants) ? formErrors.variants[0] : formErrors.variants}</span>
            </div>
          )}

          {/* ভেরিয়েন্টে ইউনিট ইনফো */}
          {productForm.data.unit_type !== 'piece' && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>{t("product.variant_unit_note", "Note for Variants:")}</strong>
                <p className="mt-1">
                  {t("product.variant_unit_description", "All variants will use the same unit settings. Each variant's stock will be tracked in")}
                  <strong> {safeUpperCase(productForm.data.default_unit)}</strong>
                  {t("product.and_can_be_sold_in", " and can be sold in")}
                  <strong> {safeUpperCase(productForm.data.min_sale_unit) || safeUpperCase(productForm.data.default_unit)}</strong>
                  {t("product.or_smaller", " or smaller units")}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {variants.map((variant, index) => (
              <div key={index} className="border border-gray-300 p-4 rounded-box bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-700">
                      {t("product.variant", "Variant")} #{index + 1}
                    </h4>
                    {variant.id && <span className="badge badge-sm badge-outline">ID: {variant.id}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {Object.keys(variant.attribute_values || {}).length > 0 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-warning btn-outline"
                        onClick={() => handleClearVariantAttributes(index)}
                        title={t("product.clear_attributes", "Clear attributes")}
                      >
                        <X size={12} />
                      </button>
                    )}

                    {variants.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-xs btn-error btn-outline"
                        onClick={() => handleDeleteVariant(index)}
                        title={t("product.delete_variant", "Delete variant")}
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="label py-1">
                    <span className="label-text font-medium">{t("product.variant_attributes", "Variant Attributes")}</span>
                  </label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {variant.attribute_values &&
                      Object.entries(variant.attribute_values).map(([attribute, value]) => (
                        <span key={attribute} className="badge badge-outline badge-primary">
                          <span className="font-medium">{attribute}:</span> {value}
                        </span>
                      ))}

                    {(!variant.attribute_values || Object.keys(variant.attribute_values).length === 0) && (
                      <div className="text-sm text-gray-500 italic">
                        {t("product.no_attributes_selected", "No attributes selected")}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn bg-[#1e4d2b] text-white btn-sm"
                    onClick={() => openVariantAttributeSelector(index)}
                  >
                    {variant.attribute_values && Object.keys(variant.attribute_values).length > 0
                      ? t("product.edit_attributes", "Edit Attributes")
                      : t("product.select_attributes", "Select Attributes")}
                  </button>
                </div>

                {variantAttributeSelector === index && (
                  <div className="border border-gray-300 p-4 rounded-box bg-gray-50 mb-4 mt-3">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">
                        {t("product.select_attributes_for", "Select Attributes for")} Variant #{index + 1}
                      </h4>
                      <button type="button" className="btn btn-xs btn-circle" onClick={closeVariantAttributeSelector}>
                        <X size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableAttributes.map((attribute) => (
                        <div key={attribute.code} className="border rounded-box p-3">
                          <h5 className="font-medium mb-2">{attribute.name}</h5>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {attribute.active_values?.map((value) => (
                              <label
                                key={value.id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={variant.attribute_values && variant.attribute_values[attribute.code] === value.value}
                                  onChange={(e) =>
                                    handleVariantAttributeSelect(index, attribute.code, value.value, e.target.checked)
                                  }
                                  className="checkbox checkbox-sm checkbox-primary"
                                />
                                <span className="text-sm">{value.value}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end items-center mt-4">
                      <button type="button" className="btn bg-[#1e4d2b] text-white btn-sm" onClick={closeVariantAttributeSelector}>
                        {t("product.done", "Done")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="border-t pt-6 mt-6">
          <div className="flex justify-end">
            <button
              className={`btn ${productType === "in_house" ? "btn-warning" : "bg-[#1e4d2b] text-white"}`}
              type="submit"
              disabled={productForm.processing}
            >
              {productForm.processing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t("product.saving", "Saving...")}
                </>
              ) : (
                <>
                  {update ? t("product.update_product", "Update Product") : t("product.save_product", "Save Product")}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}