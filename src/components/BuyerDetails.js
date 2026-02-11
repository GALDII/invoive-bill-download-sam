import React from 'react';
import InputGroup from './ui/InputGroup';
import TextareaGroup from './ui/TextareaGroup';
import Card from './ui/Card';
import Button from './ui/Button';

const BuyerDetails = ({
    details,
    onChange,
    placeholder,
    readOnly,
    onSaveCustomer,
    canSave
}) => {
    const handleChange = (field, value) => {
        onChange({ ...details, [field]: value });
    };

    return (
        <Card
            title="Buyer Details"
            icon="👤"
            className="h-full border-t-4 border-t-blue-500"
            headerAction={
                !readOnly && canSave && (
                    <Button
                        variant="success"
                        onClick={onSaveCustomer}
                        className="text-xs px-3 py-1"
                    >
                        Save Customer
                    </Button>
                )
            }
        >
            <div className="grid grid-cols-1 gap-4">
                <InputGroup
                    label="Business Name"
                    value={details.name}
                    placeholder={placeholder.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    readOnly={readOnly}
                />
                <TextareaGroup
                    label="Address"
                    value={details.address}
                    placeholder={placeholder.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    readOnly={readOnly}
                />
                <InputGroup
                    label="GSTIN"
                    value={details.gstin}
                    placeholder={placeholder.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                    isMonospace
                    readOnly={readOnly}
                />
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup
                        label="State"
                        value={details.state}
                        placeholder={placeholder.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        readOnly={readOnly}
                    />
                    <InputGroup
                        label="State Code"
                        value={details.stateCode}
                        placeholder={placeholder.stateCode}
                        onChange={(e) => handleChange('stateCode', e.target.value)}
                        readOnly={readOnly}
                    />
                </div>
            </div>
        </Card>
    );
};

export default BuyerDetails;
