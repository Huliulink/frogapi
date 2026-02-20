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
  Select,
  Divider,
} from '@douyinfe/semi-ui';
import { SiAlipay, SiWechat, SiStripe } from 'react-icons/si';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Ban,
  Ticket,
} from 'lucide-react';

const { Text } = Typography;

const PurchaseModal = ({
  t,
  visible,
  onCancel,
  onConfirm,
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
  const [promoCode, setPromoCode] = useState('');

  const hasDiscount =
    discountRate && discountRate > 0 && discountRate < 1 && amountNumber > 0;
  const originalAmount = hasDiscount ? amountNumber / discountRate : 0;
  const discountAmount = hasDiscount ? originalAmount - amountNumber : 0;

  const handleConfirm = () => {
    if (!selectedPayMethod) {
      return;
    }
    onConfirm(selectedPayMethod, promoCode);
  };

  const handleClose = () => {
    setSelectedPayMethod('');
    setPromoCode('');
    onCancel();
  };

  const getPayIcon = (type) => {
    if (type === 'alipay') return <SiAlipay size={14} color='#1677FF' />;
    if (type === 'wxpay') return <SiWechat size={14} color='#07C160' />;
    if (type === 'stripe') return <SiStripe size={14} color='#635BFF' />;
    return (
      <CreditCard size={14} style={{ color: 'var(--semi-color-text-2)' }} />
    );
  };

  // 构建支付方式下拉选项
  const payMethodOptions = (payMethods || [])
    .map((method) => {
      const minTopupVal = Number(method.min_topup) || 0;
      const isStripe = method.type === 'stripe';
      const disabled =
        (!enableOnlineTopUp && !isStripe) ||
        (!enableStripeTopUp && isStripe) ||
        minTopupVal > Number(topUpCount || 0);

      return {
        value: method.type,
        label: (
          <span className='flex items-center gap-2'>
            {getPayIcon(method.type)}
            <span>{method.name}</span>
            {disabled && minTopupVal > Number(topUpCount || 0) && (
              <span
                className='text-xs'
                style={{ color: 'var(--semi-color-text-2)' }}
              >
                ({t('最低')} {minTopupVal})
              </span>
            )}
          </span>
        ),
        disabled,
      };
    })
    .filter(Boolean);

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <CreditCard size={18} />
          {t('购买确认')}
        </div>
      }
      visible={visible}
      onCancel={handleClose}
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
                  <Text
                    strong
                    style={{ color: 'var(--semi-color-danger)' }}
                  >
                    {renderAmount()}
                  </Text>
                  {hasDiscount && (
                    <Text
                      size='small'
                      style={{ color: 'var(--semi-color-success)' }}
                    >
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
        <Card
          className='!rounded-xl'
          bodyStyle={{ padding: '14px 16px' }}
          style={{ backgroundColor: 'var(--semi-color-fill-0)' }}
        >
          <div className='flex items-center gap-2 mb-2'>
            <ShieldCheck size={15} style={{ color: 'var(--semi-color-warning)' }} />
            <Text strong className='text-sm'>
              {t('购买须知')}
            </Text>
          </div>
          <div className='space-y-1.5 pl-[23px]'>
            <div className='flex items-start gap-2 text-xs' style={{ color: 'var(--semi-color-text-2)' }}>
              <Clock size={12} className='mt-0.5 shrink-0' />
              <span>{t('充值成功后额度将立即到账，请确认充值金额无误')}</span>
            </div>
            <div className='flex items-start gap-2 text-xs' style={{ color: 'var(--semi-color-text-2)' }}>
              <Ban size={12} className='mt-0.5 shrink-0' />
              <span>{t('虚拟商品一经充值成功，不支持退款或转让')}</span>
            </div>
            <div className='flex items-start gap-2 text-xs' style={{ color: 'var(--semi-color-text-2)' }}>
              <AlertTriangle size={12} className='mt-0.5 shrink-0' />
              <span>{t('如遇支付异常或额度未到账，请及时联系客服处理')}</span>
            </div>
          </div>
        </Card>

        <Divider margin={0} />

        {/* 选择支付方式 */}
        <div>
          <Text strong className='block mb-2 text-sm'>
            {t('选择支付方式')}
          </Text>
          {payMethodOptions.length > 0 ? (
            <Select
              placeholder={t('请选择支付方式')}
              style={{ width: '100%' }}
              value={selectedPayMethod || undefined}
              onChange={(val) => setSelectedPayMethod(val)}
              optionList={payMethodOptions}
              renderSelectedItem={(optionNode) => {
                const method = (payMethods || []).find(
                  (m) => m.type === optionNode?.value,
                );
                if (!method) return optionNode?.value;
                return (
                  <span className='flex items-center gap-2'>
                    {getPayIcon(method.type)}
                    <span>{method.name}</span>
                  </span>
                );
              }}
            />
          ) : (
            <Text type='tertiary' className='text-sm'>
              {t('暂无可用的支付方式，请联系管理员配置')}
            </Text>
          )}
        </div>

        {/* 优惠码 */}
        <div>
          <Text strong className='block mb-2 text-sm'>
            {t('优惠码')}
            <Text type='tertiary' size='small' className='ml-1'>
              ({t('可选')})
            </Text>
          </Text>
          <Input
            prefix={<Ticket size={14} style={{ color: 'var(--semi-color-text-2)' }} />}
            placeholder={t('请输入优惠码')}
            value={promoCode}
            onChange={(val) => setPromoCode(val)}
            showClear
          />
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
