import React from 'react';
import InputGroup from './ui/InputGroup';
import TextareaGroup from './ui/TextareaGroup';
import Card from './ui/Card';

const SellerDetails = ({ details, onChange, placeholder }) => {
    const handleChange = (field, value) => {
        onChange({ ...details, [field]: value });
    };

    return (
        <Card
            title="Seller Details"
            icon="🏢"
            className="h-full border-t-4 border-t-orange-500"
        >
            <div className="grid grid-cols-1 gap-4">
                <InputGroup
                    label="Business Name"
                    value={details.name}
                    placeholder={placeholder.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                />
                <TextareaGroup
                    label="Address"
                    value={details.address}
                    placeholder={placeholder.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                />
                <InputGroup
                    label="GSTIN"
                    value={details.gstin}
                    placeholder={placeholder.gstin}
                    onChange={(e) => handleChange('gstin', e.target.value)}
                    isMonospace
                />
                <div className="grid grid-cols-2 gap-4">
                    <InputGroup
                        label="State"
                        value={details.state}
                        placeholder={placeholder.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                    />
                    <InputGroup
                        label="State Code"
                        value={details.stateCode}
                        placeholder={placeholder.stateCode}
                        onChange={(e) => handleChange('stateCode', e.target.value)}
                    />
                </div>
            </div>
        </Card>
    );
};

export default SellerDetails;
