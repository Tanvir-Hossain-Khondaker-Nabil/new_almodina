// resources/js/Pages/attributes/AttributeIndex.jsx
import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { Plus, Trash, Edit, X, Save, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export default function AttributeIndex({ attributes }) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [addingValues, setAddingValues] = useState({});
    const [autoGenerateCode, setAutoGenerateCode] = useState(true);
    const { t, locale } = useTranslation();

    const attributeForm = useForm({
        id: '',
        name: '',
        code: '',
        values: [{ value: '', code: '' }]
    });

    // Auto-generate code from name
    const generateCode = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/gi, '') // Remove special characters
            .replace(/\s+/g, '_'); // Replace spaces with underscores
    };

    // Auto-generate value code from value
    const generateValueCode = (value) => {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/gi, '')
            .replace(/\s+/g, '_');
    };

    // Sync code when name changes if auto-generate is enabled
    useEffect(() => {
        if (autoGenerateCode && attributeForm.data.name && !attributeForm.data.code) {
            const generatedCode = generateCode(attributeForm.data.name);
            attributeForm.setData('code', generatedCode);
        }
    }, [attributeForm.data.name]);

    // Handle attribute form
    const handleAddValueField = () => {
        attributeForm.setData('values', [...attributeForm.data.values, { value: '', code: '' }]);
    };

    const handleValueChange = (index, field, newValue) => {
        const newValues = [...attributeForm.data.values];
        newValues[index][field] = newValue;
        
        // Auto-generate code when value changes and code field is empty
        if (field === 'value' && newValue && !newValues[index].code) {
            newValues[index].code = generateValueCode(newValue);
        }
        
        attributeForm.setData('values', newValues);
    };

    const handleRemoveValueField = (index) => {
        const newValues = attributeForm.data.values.filter((_, i) => i !== index);
        attributeForm.setData('values', newValues);
    };

    const submitAttribute = (e) => {
        e.preventDefault();
        
        const url = editingAttribute 
            ? route('attributes.update', { attribute: editingAttribute.id })
            : route('attributes.store');
            
        const method = editingAttribute ? 'put' : 'post';

        router[method](url, attributeForm.data, {
            onSuccess: () => {
                attributeForm.reset();
                setShowCreateForm(false);
                setEditingAttribute(null);
                setAutoGenerateCode(true); // Reset to auto-generate for next creation
            }
        });
    };

    const handleCreate = () => {
        attributeForm.reset();
        attributeForm.setData('values', [{ value: '', code: '' }]);
        setShowCreateForm(true);
        setEditingAttribute(null);
        setAutoGenerateCode(true);
    };

    const handleEdit = (attribute) => {
        attributeForm.setData({
            id: attribute.id,
            name: attribute.name,
            code: attribute.code,
            values: attribute.values.map(val => ({
                id: val.id,
                value: val.value,
                code: val.code
            }))
        });
        setEditingAttribute(attribute);
        setShowCreateForm(true);
        setAutoGenerateCode(false); // Disable auto-generate when editing
    };

    const handleCancel = () => {
        attributeForm.reset();
        setShowCreateForm(false);
        setEditingAttribute(null);
        setAutoGenerateCode(true);
    };

    const handleDeleteAttribute = (attribute) => {
        if (confirm(t('attributes.confirm_delete_attribute', `Are you sure you want to delete "${attribute.name}"?`))) {
            router.delete(route('attributes.destroy', { attribute: attribute.id }));
        }
    };

    // Handle adding values to existing attribute
    const handleAddValueToAttribute = (attributeId) => {
        setAddingValues(prev => ({
            ...prev,
            [attributeId]: { value: '', code: '' }
        }));
    };

    const handleNewValueChange = (attributeId, field, value) => {
        const newState = { ...addingValues };
        
        // Auto-generate code when value changes and code field is empty
        if (field === 'value' && value && !newState[attributeId]?.code) {
            newState[attributeId] = {
                ...newState[attributeId],
                [field]: value,
                code: generateValueCode(value)
            };
        } else {
            newState[attributeId] = {
                ...newState[attributeId],
                [field]: value
            };
        }
        
        setAddingValues(newState);
    };

    const submitNewValue = (attributeId, e) => {
        e.preventDefault();
        const valueData = addingValues[attributeId];
        
        router.post(route('attributes.values.store', { attribute: attributeId }), valueData, {
            onSuccess: () => {
                setAddingValues(prev => {
                    const newState = { ...prev };
                    delete newState[attributeId];
                    return newState;
                });
            }
        });
    };

    const handleDeleteValue = (attributeId, valueId) => {
        if (confirm(t('attributes.confirm_delete_value', 'Are you sure you want to delete this value?'))) {
            router.delete(route('attributes.values.destroy', { 
                attribute: attributeId, 
                value: valueId 
            }));
        }
    };

    const handleRegenerateCode = () => {
        if (attributeForm.data.name) {
            const generatedCode = generateCode(attributeForm.data.name);
            attributeForm.setData('code', generatedCode);
        }
    };

    const handleRegenerateValueCode = (index) => {
        const newValues = [...attributeForm.data.values];
        if (newValues[index].value) {
            newValues[index].code = generateValueCode(newValues[index].value);
            attributeForm.setData('values', newValues);
        }
    };

    return (
        <div className={`p-6 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">
                        {t('attributes.management', 'Attributes Management')}
                    </h1>
                    <p className="text-gray-600">
                        {t('attributes.management_description', 'Manage product attributes and their values')}
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="btn bg-[#1e4d2b] text-white"
                >
                    <Plus size={16} className="mr-2" />
                    {t('attributes.create_attribute', 'Create Attribute')}
                </button>
            </div>

            {/* Create/Edit Attribute Form */}
            {showCreateForm && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">
                            {editingAttribute 
                                ? t('attributes.edit_attribute', 'Edit Attribute')
                                : t('attributes.create_new_attribute', 'Create New Attribute')
                            }
                        </h2>
                        <button
                            onClick={handleCancel}
                            className="btn btn-ghost btn-sm"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    <form onSubmit={submitAttribute}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="label">
                                    {t('attributes.attribute_name', 'Attribute Name')} *
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={attributeForm.data.name}
                                    onChange={(e) => attributeForm.setData('name', e.target.value)}
                                    placeholder={t('attributes.name_placeholder', 'e.g., Color, Size, Model')}
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="label">
                                        {t('attributes.attribute_code', 'Attribute Code')} *
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <label className="label cursor-pointer space-x-1">
                                            <span className="text-xs text-gray-500">
                                                {t('attributes.auto_generate', 'Auto-generate')}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={autoGenerateCode}
                                                onChange={(e) => setAutoGenerateCode(e.target.checked)}
                                                className="toggle toggle-xs"
                                            />
                                        </label>
                                        {!autoGenerateCode && (
                                            <button
                                                type="button"
                                                onClick={handleRegenerateCode}
                                                className="btn btn-xs btn-ghost"
                                                title={t('attributes.regenerate_code', 'Regenerate code from name')}
                                            >
                                                <RefreshCw size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={attributeForm.data.code}
                                    onChange={(e) => attributeForm.setData('code', e.target.value)}
                                    onBlur={(e) => {
                                        if (autoGenerateCode && !e.target.value && attributeForm.data.name) {
                                            const generatedCode = generateCode(attributeForm.data.name);
                                            attributeForm.setData('code', generatedCode);
                                        }
                                    }}
                                    placeholder={t('attributes.code_placeholder', 'e.g., color, size, model')}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('attributes.code_hint', 'Use lowercase letters, numbers, and underscores only')}
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <label className="label">
                                    {t('attributes.attribute_values', 'Attribute Values')} *
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddValueField}
                                    className="btn btn-sm btn-outline"
                                >
                                    <Plus size={14} className="mr-1" />
                                    {t('attributes.add_value', 'Add Value')}
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                {attributeForm.data.values.map((value, index) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={value.value}
                                                onChange={(e) => handleValueChange(index, 'value', e.target.value)}
                                                placeholder={t('attributes.value_placeholder', 'Value (e.g., Small, Red)')}
                                                required
                                            />
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                className="input input-bordered w-full pr-10"
                                                value={value.code}
                                                onChange={(e) => handleValueChange(index, 'code', e.target.value)}
                                                onBlur={(e) => {
                                                    if (value.value && !e.target.value) {
                                                        handleValueChange(index, 'code', generateValueCode(value.value));
                                                    }
                                                }}
                                                placeholder={t('attributes.code_placeholder', 'Code (e.g., sm, red)')}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRegenerateValueCode(index)}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-xs btn-ghost"
                                                title={t('attributes.regenerate_code', 'Regenerate code from value')}
                                            >
                                                <RefreshCw size={12} />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveValueField(index)}
                                            disabled={attributeForm.data.values.length === 1}
                                            className="btn btn-sm btn-error mt-1"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="btn bg-[#1e4d2b] text-white"
                                disabled={attributeForm.processing}
                            >
                                <Save size={16} className="mr-2" />
                                {attributeForm.processing 
                                    ? t('attributes.saving', 'Saving...')
                                    : (editingAttribute 
                                        ? t('attributes.update_attribute', 'Update Attribute')
                                        : t('attributes.create_attribute', 'Create Attribute')
                                      )
                                }
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn btn-ghost"
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Attributes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attributes.map((attribute) => (
                    <div key={attribute.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">{attribute.name}</h3>
                                <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {attribute.code}
                                </code>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleEdit(attribute)}
                                    className="btn btn-sm btn-outline bg-[#1e4d2b] text-white"
                                >
                                    <Edit size={14} />
                                </button>
                                <button
                                    onClick={() => handleDeleteAttribute(attribute)}
                                    className="btn btn-sm btn-outline btn-error"
                                >
                                    <Trash size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Values List */}
                        <div className="space-y-2 mb-4">
                            {attribute.values.map((value) => (
                                <div key={value.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                                    <div>
                                        <span className="font-medium">{value.value}</span>
                                        <code className="text-xs text-gray-500 ml-2 bg-gray-200 px-1 rounded">
                                            {value.code}
                                        </code>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteValue(attribute.id, value.id)}
                                        className="btn btn-xs btn-error"
                                    >
                                        <Trash size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Value Form */}
                        <div className="border-t pt-3">
                            {addingValues[attribute.id] ? (
                                <form onSubmit={(e) => submitNewValue(attribute.id, e)} className="space-y-2">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="input input-sm input-bordered flex-1"
                                            value={addingValues[attribute.id].value}
                                            onChange={(e) => handleNewValueChange(attribute.id, 'value', e.target.value)}
                                            onBlur={(e) => {
                                                if (e.target.value && !addingValues[attribute.id].code) {
                                                    handleNewValueChange(attribute.id, 'code', generateValueCode(e.target.value));
                                                }
                                            }}
                                            placeholder={t('attributes.value', 'Value')}
                                            required
                                        />
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                className="input input-sm input-bordered w-full pr-8"
                                                value={addingValues[attribute.id].code}
                                                onChange={(e) => handleNewValueChange(attribute.id, 'code', e.target.value)}
                                                placeholder={t('attributes.code', 'Code')}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (addingValues[attribute.id].value) {
                                                        const generatedCode = generateValueCode(addingValues[attribute.id].value);
                                                        handleNewValueChange(attribute.id, 'code', generatedCode);
                                                    }
                                                }}
                                                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-xs btn-ghost"
                                                title={t('attributes.regenerate_code', 'Regenerate code')}
                                            >
                                                <RefreshCw size={10} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" className="btn btn-sm bg-[#1e4d2b] text-white flex-1">
                                            <Plus size={12} className="mr-1" />
                                            {t('attributes.add', 'Add')}
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setAddingValues(prev => {
                                                const newState = { ...prev };
                                                delete newState[attribute.id];
                                                return newState;
                                            })}
                                            className="btn btn-sm btn-ghost"
                                        >
                                            {t('common.cancel', 'Cancel')}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <button
                                    onClick={() => handleAddValueToAttribute(attribute.id)}
                                    className="btn btn-sm btn-outline w-full"
                                >
                                    <Plus size={14} className="mr-1" />
                                    {t('attributes.add_value', 'Add Value')}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {attributes.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <Plus size={48} className="mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        {t('attributes.no_attributes_found', 'No attributes found')}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {t('attributes.get_started', 'Get started by creating your first attribute')}
                    </p>
                    <button
                        onClick={handleCreate}
                        className="btn bg-[#1e4d2b] text-white"
                    >
                        <Plus size={16} className="mr-2" />
                        {t('attributes.create_attribute', 'Create Attribute')}
                    </button>
                </div>
            )}
        </div>
    );
}