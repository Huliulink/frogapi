import React from 'react';
import { RadioGroup, Radio } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const CurrencyToggle = ({ currency, onChange }) => {
  const { t } = useTranslation();

  return (
    <RadioGroup
      type='button'
      size='small'
      value={currency}
      onChange={(e) => onChange(e.target.value)}
    >
      <Radio value='USD'>USD ($)</Radio>
      <Radio value='CNY'>CNY (¥)</Radio>
    </RadioGroup>
  );
};

export default CurrencyToggle;
