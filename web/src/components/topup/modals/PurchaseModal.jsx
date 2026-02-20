/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useState } from 'react';
import {
  Modal,
  Typography,
  Card,
  Button,
  Input,
  Skeleton,
  Banner,
  Tooltip,
} from '@douyinfe/semi-ui';
import { SiAlipay, SiWechat, SiStripe } from 'react-icons/si';
import { CreditCard, ShieldCheck, Tag } from 'lucide-react';

const { Text } = Typography;

const PurchaseModal = ({
  t,
  visible,
  onCancel,
  onConfirm,
  product,
  payMethods = [],
  enableOnlineTopUp,
  enableStripeTopUp,
  amountLoading,
  renderAmount,
  confirmLoading,
  topUpCount,
  renderQuotaWithAmount,
  amountNumber,
  discountRate,
}) => {
  const [selectedPayMethod, setSelectedPayMethod] = useState('');

  const hasDiscount =
    discountRate && discountRate > 0 && discountRate < 1 && amountNumber > 0;
  const originalAmount = hasDiscount ? amountNumber / discountRate : 0;
  const discountAmount = hasDiscount ? originalAmount - amountNumber : 0;

  const handleConfirm = () => {
    if (!selectedPayMethod) {
      return;
    }
    onConfirm(selectedPayMethod);
  };

  const getPayIcon = (type) => {
    if (type === 'alipay') return <SiAlipay size={20} color='#1677FF' />;
    if (type === 'wxpay') return <SiWechat size={20} color='#07C160' />;
    if (type === 'stripe') return <SiStripe size={20} color='#635BFF' />;
    return <CreditCard size={20} style={{ color: 'var(--semi-color-text-2)' }} />;
  };

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <CreditCard size={18} />
          {t('购买确认')}
        </div>
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      maskClosable={false}
      centered
      style={{ maxWidth: 480 }}
    >
      <div className='space-y-4'>
        {/* 商品信息 */}
        <Card
          className='!rounded-xl'
          bodyStyle={{ padding: '16px' }}
          style={{ backgroundColor: 'var(--semi-color-fill-0)' }}
        >
          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <Text type='secondary'>{t('充值数量')}</Text>
              <Text strong>{renderQuotaWithAmount(topUpCount)}</Text>
            </div>
            <div className='flex justify-between items-center'>
              <Text type='secondary'>{t('实付金额')}</Text>
              {amountLoading ? (
                <Skeleton.Title style={{ width: 60, height: 16 }} />
              ) : (
                <div className='flex items-center gap-2'>
                  <Text strong style={{ color: 'var(--semi-color-danger)' }}>
                    {renderAmount()}
                  </Text>
                  {hasDiscount && (
                    <Text size='small' style={{ color: 'var(--semi-color-success)' }}>
                      {Math.round(discountRate * 100)}%
                    </Text>
                  )}
                </div>
              )}
            </div>
            {hasDiscount && !amountLoading && (
              <>
                <div className='flex justify-between items-center'>
                  <Text type='tertiary'>{t('原价')}</Text>
                  <Text delete type='tertiary'>
                    {originalAmount.toFixed(2)} {t('元')}
                  </Text>
                </div>
                <div className='flex justify-between items-center'>
                  <Text type='tertiary'>{t('优惠')}</Text>
                  <Text style={{ color: 'var(--semi-color-success)' }}>
                    - {discountAmount.toFixed(2)} {t('元')}
                  </Text>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* 购买须知 */}
        <Banner
          type='info'
          icon={<ShieldCheck size={16} />}
          closeIcon={null}
          description={
            <div className='text-xs space-y-1'>
              <div>{t('充值成功后额度将立即到账')}</div>
              <div>{t('如遇支付问题请联系客服处理')}</div>
            </div>
          }
          className='!rounded-xl'
        />

        {/* 选择支付方式 */}
        <div>
          <Text strong className='block mb-2'>
            {t('选择支付方式')}
          </Text>
          {payMethods && payMethods.length > 0 ? (
            <div className='grid grid-cols-2 gap-2'>
              {payMethods.map((method) => {
                const minTopupVal = Number(method.min_topup) || 0;
                const isStripe = method.type === 'stripe';
                const disabled =
                  (!enableOnlineTopUp && !isStripe) ||
                  (!enableStripeTopUp && isStripe) ||
                  minTopupVal > Number(topUpCount || 0);
                const isSelected = selectedPayMethod === method.type;

                const card = (
                  <Card
                    key={method.type}
                    className='!rounded-xl cursor-pointer transition-all'
                    bodyStyle={{ padding: '12px' }}
                    style={{
                      border: isSelected
                        ? '2px solid var(--semi-color-primary)'
                        : '1px solid var(--semi-color-border)',
                      opacity: disabled ? 0.5 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !disabled && setSelectedPayMethod(method.type)}
                  >
                    <div className='flex items-center gap-2'>
                      {getPayIcon(method.type)}
                      <Text className='text-sm'>{method.name}</Text>
                    </div>
                  </Card>
                );

                return disabled && minTopupVal > Number(topUpCount || 0) ? (
                  <Tooltip
                    key={method.type}
                    content={t('此支付方式最低充值金额为') + ' ' + minTopupVal}
                  >
                    {card}
                  </Tooltip>
                ) : (
                  <React.Fragment key={method.type}>{card}</React.Fragment>
                );
              })}
            </div>
          ) : (
            <Text type='tertiary' className='text-sm'>
              {t('暂无可用的支付方式，请联系管理员配置')}
            </Text>
          )}
        </div>

        {/* 确认按钮 */}
        <Button
          theme='solid'
          type='primary'
          block
          size='large'
          className='!rounded-xl'
          onClick={handleConfirm}
          loading={confirmLoading}
          disabled={!selectedPayMethod}
        >
          {t('确认支付')}
        </Button>
      </div>
    </Modal>
  );
};

export default PurchaseModal;
