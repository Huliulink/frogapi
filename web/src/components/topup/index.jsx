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

import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  API,
  showError,
  showInfo,
  showSuccess,
  renderQuota,
  renderQuotaWithAmount,
  copy,
  getQuotaPerUnit,
} from '../../helpers';
import {
  Card,
  Modal,
  Toast,
  Typography,
  Tag,
  Banner,
  Form,
  Spin,
  Input,
  Badge,
  Button,
} from '@douyinfe/semi-ui';
import { IconGift } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import {
  Wallet,
  Coins,
  Gift,
  Copy,
  Zap,
  TrendingUp,
  BarChart2,
  Users,
  Sparkles,
  Receipt,
  ShoppingBag,
} from 'lucide-react';
import { getCurrencyConfig } from '../../helpers/render';

import TransferModal from './modals/TransferModal';
import PaymentConfirmModal from './modals/PaymentConfirmModal';
import PurchaseModal from './modals/PurchaseModal';
import OrderHistory from './OrderHistory';
import SubscriptionPlansCard from './SubscriptionPlansCard';

const TopUp = () => {
  const { t } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);

  const [redemptionCode, setRedemptionCode] = useState('');
  const [amount, setAmount] = useState(0.0);
  const [minTopUp, setMinTopUp] = useState(statusState?.status?.min_topup || 1);
  const [topUpCount, setTopUpCount] = useState(
    statusState?.status?.min_topup || 1,
  );
  const [topUpLink, setTopUpLink] = useState(
    statusState?.status?.top_up_link || '',
  );
  const [enableOnlineTopUp, setEnableOnlineTopUp] = useState(
    statusState?.status?.enable_online_topup || false,
  );
  const [priceRatio, setPriceRatio] = useState(statusState?.status?.price || 1);

  const [enableStripeTopUp, setEnableStripeTopUp] = useState(
    statusState?.status?.enable_stripe_topup || false,
  );
  const [statusLoading, setStatusLoading] = useState(true);

  // Creem 相关状态
  const [creemProducts, setCreemProducts] = useState([]);
  const [enableCreemTopUp, setEnableCreemTopUp] = useState(false);
  const [creemOpen, setCreemOpen] = useState(false);
  const [selectedCreemProduct, setSelectedCreemProduct] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [payWay, setPayWay] = useState('');
  const [amountLoading, setAmountLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [payMethods, setPayMethods] = useState([]);

  const affFetchedRef = useRef(false);

  // 邀请相关状态
  const [affLink, setAffLink] = useState('');
  const [openTransfer, setOpenTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);

  // 账单Modal状态
  const [openHistory, setOpenHistory] = useState(false);

  // 订阅相关
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [billingPreference, setBillingPreference] =
    useState('subscription_first');
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [allSubscriptions, setAllSubscriptions] = useState([]);

  // 预设充值额度选项
  const [presetAmounts, setPresetAmounts] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);

  // 充值配置信息
  const [topupInfo, setTopupInfo] = useState({
    amount_options: [],
    discount: {},
  });

  // 购买弹窗状态
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const shouldShowSubscription =
    !subscriptionLoading && subscriptionPlans.length > 0;

  const topUp = async () => {
    if (redemptionCode === '') {
      showInfo(t('请输入兑换码！'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await API.post('/api/user/topup', {
        key: redemptionCode,
      });
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('兑换成功！'));
        Modal.success({
          title: t('兑换成功！'),
          content: t('成功兑换额度：') + renderQuota(data),
          centered: true,
        });
        if (userState.user) {
          const updatedUser = {
            ...userState.user,
            quota: userState.user.quota + data,
          };
          userDispatch({ type: 'login', payload: updatedUser });
        }
        setRedemptionCode('');
      } else {
        showError(message);
      }
    } catch (err) {
      showError(t('请求失败'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTopUpLink = () => {
    if (!topUpLink) {
      showError(t('超级管理员未设置充值链接！'));
      return;
    }
    window.open(topUpLink, '_blank');
  };

  const preTopUp = async (payment) => {
    if (payment === 'stripe') {
      if (!enableStripeTopUp) {
        showError(t('管理员未开启Stripe充值！'));
        return;
      }
    } else {
      if (!enableOnlineTopUp) {
        showError(t('管理员未开启在线充值！'));
        return;
      }
    }

    setPayWay(payment);
    setPaymentLoading(true);
    try {
      if (payment === 'stripe') {
        await getStripeAmount();
      } else {
        await getAmount();
      }

      if (topUpCount < minTopUp) {
        showError(t('充值数量不能小于') + minTopUp);
        return;
      }
      setOpen(true);
    } catch (error) {
      showError(t('获取金额失败'));
    } finally {
      setPaymentLoading(false);
    }
  };

  const onlineTopUp = async () => {
    if (payWay === 'stripe') {
      // Stripe 支付处理
      if (amount === 0) {
        await getStripeAmount();
      }
    } else {
      // 普通支付处理
      if (amount === 0) {
        await getAmount();
      }
    }

    if (topUpCount < minTopUp) {
      showError('充值数量不能小于' + minTopUp);
      return;
    }
    setConfirmLoading(true);
    try {
      let res;
      if (payWay === 'stripe') {
        // Stripe 支付请求
        res = await API.post('/api/user/stripe/pay', {
          amount: parseInt(topUpCount),
          payment_method: 'stripe',
        });
      } else {
        // 普通支付请求
        res = await API.post('/api/user/pay', {
          amount: parseInt(topUpCount),
          payment_method: payWay,
        });
      }

      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          if (payWay === 'stripe') {
            // Stripe 支付回调处理
            window.open(data.pay_link, '_blank');
          } else {
            // 普通支付表单提交
            let params = data;
            let url = res.data.url;
            let form = document.createElement('form');
            form.action = url;
            form.method = 'POST';
            let isSafari =
              navigator.userAgent.indexOf('Safari') > -1 &&
              navigator.userAgent.indexOf('Chrome') < 1;
            if (!isSafari) {
              form.target = '_blank';
            }
            for (let key in params) {
              let input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = params[key];
              form.appendChild(input);
            }
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
          }
        } else {
          const errorMsg =
            typeof data === 'string' ? data : message || t('支付失败');
          showError(errorMsg);
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
      showError(t('支付请求失败'));
    } finally {
      setOpen(false);
      setConfirmLoading(false);
    }
  };

  const creemPreTopUp = async (product) => {
    if (!enableCreemTopUp) {
      showError(t('管理员未开启 Creem 充值！'));
      return;
    }
    setSelectedCreemProduct(product);
    setCreemOpen(true);
  };

  const onlineCreemTopUp = async () => {
    if (!selectedCreemProduct) {
      showError(t('请选择产品'));
      return;
    }
    // Validate product has required fields
    if (!selectedCreemProduct.productId) {
      showError(t('产品配置错误，请联系管理员'));
      return;
    }
    setConfirmLoading(true);
    try {
      const res = await API.post('/api/user/creem/pay', {
        product_id: selectedCreemProduct.productId,
        payment_method: 'creem',
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          processCreemCallback(data);
        } else {
          const errorMsg =
            typeof data === 'string' ? data : message || t('支付失败');
          showError(errorMsg);
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
      showError(t('支付请求失败'));
    } finally {
      setCreemOpen(false);
      setConfirmLoading(false);
    }
  };

  const processCreemCallback = (data) => {
    // 与 Stripe 保持一致的实现方式
    window.open(data.checkout_url, '_blank');
  };

  const getUserQuota = async () => {
    let res = await API.get(`/api/user/self`);
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
    } else {
      showError(message);
    }
  };

  const getSubscriptionPlans = async () => {
    setSubscriptionLoading(true);
    try {
      const res = await API.get('/api/subscription/plans');
      if (res.data?.success) {
        setSubscriptionPlans(res.data.data || []);
      }
    } catch (e) {
      setSubscriptionPlans([]);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const getSubscriptionSelf = async () => {
    try {
      const res = await API.get('/api/subscription/self');
      if (res.data?.success) {
        setBillingPreference(
          res.data.data?.billing_preference || 'subscription_first',
        );
        // Active subscriptions
        const activeSubs = res.data.data?.subscriptions || [];
        setActiveSubscriptions(activeSubs);
        // All subscriptions (including expired)
        const allSubs = res.data.data?.all_subscriptions || [];
        setAllSubscriptions(allSubs);
      }
    } catch (e) {
      // ignore
    }
  };

  const updateBillingPreference = async (pref) => {
    const previousPref = billingPreference;
    setBillingPreference(pref);
    try {
      const res = await API.put('/api/subscription/self/preference', {
        billing_preference: pref,
      });
      if (res.data?.success) {
        showSuccess(t('更新成功'));
        const normalizedPref =
          res.data?.data?.billing_preference || pref || previousPref;
        setBillingPreference(normalizedPref);
      } else {
        showError(res.data?.message || t('更新失败'));
        setBillingPreference(previousPref);
      }
    } catch (e) {
      showError(t('请求失败'));
      setBillingPreference(previousPref);
    }
  };

  // 获取充值配置信息
  const getTopupInfo = async () => {
    try {
      const res = await API.get('/api/user/topup/info');
      const { message, data, success } = res.data;
      if (success) {
        setTopupInfo({
          amount_options: data.amount_options || [],
          discount: data.discount || {},
        });

        // 处理支付方式
        let payMethods = data.pay_methods || [];
        try {
          if (typeof payMethods === 'string') {
            payMethods = JSON.parse(payMethods);
          }
          if (payMethods && payMethods.length > 0) {
            // 检查name和type是否为空
            payMethods = payMethods.filter((method) => {
              return method.name && method.type;
            });
            // 如果没有color，则设置默认颜色
            payMethods = payMethods.map((method) => {
              // 规范化最小充值数
              const normalizedMinTopup = Number(method.min_topup);
              method.min_topup = Number.isFinite(normalizedMinTopup)
                ? normalizedMinTopup
                : 0;

              // Stripe 的最小充值从后端字段回填
              if (
                method.type === 'stripe' &&
                (!method.min_topup || method.min_topup <= 0)
              ) {
                const stripeMin = Number(data.stripe_min_topup);
                if (Number.isFinite(stripeMin)) {
                  method.min_topup = stripeMin;
                }
              }

              if (!method.color) {
                if (method.type === 'alipay') {
                  method.color = 'rgba(var(--semi-blue-5), 1)';
                } else if (method.type === 'wxpay') {
                  method.color = 'rgba(var(--semi-green-5), 1)';
                } else if (method.type === 'stripe') {
                  method.color = 'rgba(var(--semi-purple-5), 1)';
                } else {
                  method.color = 'rgba(var(--semi-primary-5), 1)';
                }
              }
              return method;
            });
          } else {
            payMethods = [];
          }

          // 如果启用了 Stripe 支付，添加到支付方法列表
          // 这个逻辑现在由后端处理，如果 Stripe 启用，后端会在 pay_methods 中包含它

          setPayMethods(payMethods);
          const enableStripeTopUp = data.enable_stripe_topup || false;
          const enableOnlineTopUp = data.enable_online_topup || false;
          const enableCreemTopUp = data.enable_creem_topup || false;
          const minTopUpValue = enableOnlineTopUp
            ? data.min_topup
            : enableStripeTopUp
              ? data.stripe_min_topup
              : 1;
          setEnableOnlineTopUp(enableOnlineTopUp);
          setEnableStripeTopUp(enableStripeTopUp);
          setEnableCreemTopUp(enableCreemTopUp);
          setMinTopUp(minTopUpValue);
          setTopUpCount(minTopUpValue);

          // 设置 Creem 产品
          try {
            console.log(' data is ?', data);
            console.log(' creem products is ?', data.creem_products);
            const products = JSON.parse(data.creem_products || '[]');
            setCreemProducts(products);
          } catch (e) {
            setCreemProducts([]);
          }

          // 如果没有自定义充值数量选项，根据最小充值金额生成预设充值额度选项
          if (topupInfo.amount_options.length === 0) {
            setPresetAmounts(generatePresetAmounts(minTopUpValue));
          }

          // 初始化显示实付金额
          getAmount(minTopUpValue);
        } catch (e) {
          console.log('解析支付方式失败:', e);
          setPayMethods([]);
        }

        // 如果有自定义充值数量选项，使用它们替换默认的预设选项
        if (data.amount_options && data.amount_options.length > 0) {
          const customPresets = data.amount_options.map((amount) => ({
            value: amount,
            discount: data.discount[amount] || 1.0,
          }));
          setPresetAmounts(customPresets);
        }
      } else {
        console.error('获取充值配置失败:', data);
      }
    } catch (error) {
      console.error('获取充值配置异常:', error);
    }
  };

  // 获取邀请链接
  const getAffLink = async () => {
    const res = await API.get('/api/user/aff');
    const { success, message, data } = res.data;
    if (success) {
      let link = `${window.location.origin}/register?aff=${data}`;
      setAffLink(link);
    } else {
      showError(message);
    }
  };

  // 划转邀请额度
  const transfer = async () => {
    if (transferAmount < getQuotaPerUnit()) {
      showError(t('划转金额最低为') + ' ' + renderQuota(getQuotaPerUnit()));
      return;
    }
    const res = await API.post(`/api/user/aff_transfer`, {
      quota: transferAmount,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(message);
      setOpenTransfer(false);
      getUserQuota().then();
    } else {
      showError(message);
    }
  };

  // 复制邀请链接
  const handleAffLinkClick = async () => {
    await copy(affLink);
    showSuccess(t('邀请链接已复制到剪切板'));
  };

  useEffect(() => {
    // 始终获取最新用户数据，确保余额等统计信息准确
    getUserQuota().then();
    setTransferAmount(getQuotaPerUnit());
  }, []);

  useEffect(() => {
    if (affFetchedRef.current) return;
    affFetchedRef.current = true;
    getAffLink().then();
  }, []);

  // 在 statusState 可用时获取充值信息
  useEffect(() => {
    getTopupInfo().then();
    getSubscriptionPlans().then();
    getSubscriptionSelf().then();
  }, []);

  useEffect(() => {
    if (statusState?.status) {
      // const minTopUpValue = statusState.status.min_topup || 1;
      // setMinTopUp(minTopUpValue);
      // setTopUpCount(minTopUpValue);
      setTopUpLink(statusState.status.top_up_link || '');
      setPriceRatio(statusState.status.price || 1);

      setStatusLoading(false);
    }
  }, [statusState?.status]);

  const renderAmount = () => {
    return amount + ' ' + t('元');
  };

  const getAmount = async (value) => {
    if (value === undefined) {
      value = topUpCount;
    }
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/amount', {
        amount: parseFloat(value),
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          setAmount(parseFloat(data));
        } else {
          setAmount(0);
          Toast.error({ content: '错误：' + data, id: 'getAmount' });
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
    }
    setAmountLoading(false);
  };

  const getStripeAmount = async (value) => {
    if (value === undefined) {
      value = topUpCount;
    }
    setAmountLoading(true);
    try {
      const res = await API.post('/api/user/stripe/amount', {
        amount: parseFloat(value),
      });
      if (res !== undefined) {
        const { message, data } = res.data;
        if (message === 'success') {
          setAmount(parseFloat(data));
        } else {
          setAmount(0);
          Toast.error({ content: '错误：' + data, id: 'getAmount' });
        }
      } else {
        showError(res);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setAmountLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleTransferCancel = () => {
    setOpenTransfer(false);
  };

  const handleOpenHistory = () => {
    setOpenHistory(true);
  };

  const handleHistoryCancel = () => {
    setOpenHistory(false);
  };

  const handleCreemCancel = () => {
    setCreemOpen(false);
    setSelectedCreemProduct(null);
  };

  // 选择预设充值额度
  const selectPresetAmount = (preset) => {
    setTopUpCount(preset.value);
    setSelectedPreset(preset.value);

    // 计算实际支付金额，考虑折扣
    const discount = preset.discount || topupInfo.discount[preset.value] || 1.0;
    const discountedAmount = preset.value * priceRatio * discount;
    setAmount(discountedAmount);
  };

  // 格式化大数字显示
  const formatLargeNumber = (num) => {
    return num.toString();
  };

  // 根据最小充值金额生成预设充值额度选项
  const generatePresetAmounts = (minAmount) => {
    const multipliers = [1, 5, 10, 30, 50, 100, 300, 500];
    return multipliers.map((multiplier) => ({
      value: minAmount * multiplier,
    }));
  };

  // 点击商品卡片
  const handleProductClick = (preset) => {
    selectPresetAmount(preset);
    setPurchaseModalOpen(true);
  };

  // 购买弹窗确认
  const handlePurchaseConfirm = (paymentMethod) => {
    setPurchaseModalOpen(false);
    preTopUp(paymentMethod);
  };

  return (
    <div className='mt-[60px] px-4'>
      {/* 模态框 */}
      <TransferModal
        t={t}
        openTransfer={openTransfer}
        transfer={transfer}
        handleTransferCancel={handleTransferCancel}
        userState={userState}
        renderQuota={renderQuota}
        getQuotaPerUnit={getQuotaPerUnit}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
      />
      <PaymentConfirmModal
        t={t}
        open={open}
        onlineTopUp={onlineTopUp}
        handleCancel={handleCancel}
        confirmLoading={confirmLoading}
        topUpCount={topUpCount}
        renderQuotaWithAmount={renderQuotaWithAmount}
        amountLoading={amountLoading}
        renderAmount={renderAmount}
        payWay={payWay}
        payMethods={payMethods}
        amountNumber={amount}
        discountRate={topupInfo?.discount?.[topUpCount] || 1.0}
      />
      <PurchaseModal
        t={t}
        visible={purchaseModalOpen}
        onCancel={() => setPurchaseModalOpen(false)}
        onConfirm={handlePurchaseConfirm}
        payMethods={payMethods}
        enableOnlineTopUp={enableOnlineTopUp}
        enableStripeTopUp={enableStripeTopUp}
        amountLoading={amountLoading}
        renderAmount={renderAmount}
        confirmLoading={paymentLoading}
        topUpCount={topUpCount}
        renderQuotaWithAmount={renderQuotaWithAmount}
        amountNumber={amount}
        discountRate={topupInfo?.discount?.[topUpCount] || 1.0}
      />
      <Modal
        title={t('确定要充值 $')}
        visible={creemOpen}
        onOk={onlineCreemTopUp}
        onCancel={handleCreemCancel}
        maskClosable={false}
        size='small'
        centered
        confirmLoading={confirmLoading}
      >
        {selectedCreemProduct && (
          <>
            <p>{t('产品名称')}：{selectedCreemProduct.name}</p>
            <p>{t('价格')}：{selectedCreemProduct.currency === 'EUR' ? '€' : '$'}{selectedCreemProduct.price}</p>
            <p>{t('充值额度')}：{selectedCreemProduct.quota}</p>
            <p>{t('是否确认充值？')}</p>
          </>
        )}
      </Modal>

      {/* 标题卡片 */}
      <Card bodyStyle={{ padding: '20px 24px' }}>
        <div className='flex items-center gap-3'>
          <div
            className='flex items-center justify-center w-10 h-10 rounded-lg'
            style={{ backgroundColor: '#f59e0b15' }}
          >
            <Wallet size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <div className='text-xl font-semibold' style={{ color: 'var(--semi-color-text-0)' }}>
              {t('钱包')}
            </div>
            <div className='text-sm' style={{ color: 'var(--semi-color-text-2)' }}>
              {t('管理您的账户余额与充值')}
            </div>
          </div>
        </div>
      </Card>

      {/* 订阅套餐 */}
      {shouldShowSubscription && (
        <Card
          className='mt-3'
          title={
            <div className='flex items-center gap-2'>
              <Sparkles size={16} />
              {t('订阅套餐')}
            </div>
          }
        >
          <SubscriptionPlansCard
            t={t}
            loading={subscriptionLoading}
            plans={subscriptionPlans}
            payMethods={payMethods}
            enableOnlineTopUp={enableOnlineTopUp}
            enableStripeTopUp={enableStripeTopUp}
            enableCreemTopUp={enableCreemTopUp}
            billingPreference={billingPreference}
            onChangeBillingPreference={updateBillingPreference}
            activeSubscriptions={activeSubscriptions}
            allSubscriptions={allSubscriptions}
            reloadSubscriptionSelf={getSubscriptionSelf}
            withCard={false}
          />
        </Card>
      )}

      {/* 充值商品 */}
      {statusLoading ? (
        <Card className='mt-3'>
          <div className='py-8 flex justify-center'>
            <Spin size='large' />
          </div>
        </Card>
      ) : (enableOnlineTopUp || enableStripeTopUp) && presetAmounts.length > 0 ? (
        <Card
          className='mt-3'
          title={
            <div className='flex items-center gap-2'>
              <ShoppingBag size={16} />
              {t('选择充值额度')}
              {(() => {
                const { symbol, rate, type } = getCurrencyConfig();
                if (type === 'USD') return null;
                return (
                  <span style={{ color: 'var(--semi-color-text-2)', fontSize: '12px', fontWeight: 'normal' }}>
                    (1 $ = {rate.toFixed(2)} {symbol})
                  </span>
                );
              })()}
            </div>
          }
        >
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
            {presetAmounts.map((preset, index) => {
              const discount = preset.discount || topupInfo?.discount?.[preset.value] || 1.0;
              const originalPrice = preset.value * priceRatio;
              const discountedPrice = originalPrice * discount;
              const hasDiscount = discount < 1.0;
              const actualPay = discountedPrice;
              const save = originalPrice - discountedPrice;

              const { symbol, rate, type } = getCurrencyConfig();
              const statusStr = localStorage.getItem('status');
              let usdRate = 7;
              try {
                if (statusStr) {
                  const s = JSON.parse(statusStr);
                  usdRate = s?.usd_exchange_rate || 7;
                }
              } catch (e) {}

              let displayValue = preset.value;
              let displayActualPay = actualPay;
              let displaySave = save;

              if (type === 'USD') {
                displayActualPay = actualPay / usdRate;
                displaySave = save / usdRate;
              } else if (type === 'CNY') {
                displayValue = preset.value * usdRate;
              } else if (type === 'CUSTOM') {
                displayValue = preset.value * rate;
                displayActualPay = (actualPay / usdRate) * rate;
                displaySave = (save / usdRate) * rate;
              }

              return (
                <Card
                  key={index}
                  className='cursor-pointer transition-all hover:shadow-md'
                  style={{
                    border: selectedPreset === preset.value
                      ? '2px solid var(--semi-color-primary)'
                      : '1px solid var(--semi-color-border)',
                  }}
                  bodyStyle={{ padding: '16px' }}
                  onClick={() => handleProductClick(preset)}
                >
                  <div className='text-center'>
                    <div className='flex items-center justify-center gap-1 mb-2'>
                      <Coins size={18} style={{ color: 'var(--semi-color-primary)' }} />
                      <span className='text-lg font-bold' style={{ color: 'var(--semi-color-text-0)' }}>
                        {formatLargeNumber(displayValue)} {symbol}
                      </span>
                    </div>
                    {hasDiscount && (
                      <Tag color='green' size='small' className='mb-2'>
                        {t('折').includes('off')
                          ? ((1 - parseFloat(discount)) * 100).toFixed(1)
                          : (discount * 10).toFixed(1)}
                        {t('折')}
                      </Tag>
                    )}
                    <div style={{ color: 'var(--semi-color-text-2)', fontSize: '12px' }}>
                      {t('实付')} {symbol}{displayActualPay.toFixed(2)}
                      {hasDiscount && ` · ${t('节省')} ${symbol}${displaySave.toFixed(2)}`}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      ) : !enableCreemTopUp ? (
        <Card className='mt-3'>
          <Banner
            type='info'
            description={t('管理员未开启在线充值功能，请联系管理员开启或使用兑换码充值。')}
            className='!rounded-xl'
            closeIcon={null}
          />
        </Card>
      ) : null}

      {/* Creem 充值 */}
      {enableCreemTopUp && creemProducts.length > 0 && (
        <Card
          className='mt-3'
          title={
            <div className='flex items-center gap-2'>
              <Coins size={16} />
              {t('Creem 充值')}
            </div>
          }
        >
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
            {creemProducts.map((product, index) => (
              <Card
                key={index}
                className='cursor-pointer transition-all hover:shadow-md'
                bodyStyle={{ padding: '16px' }}
                style={{ border: '1px solid var(--semi-color-border)' }}
                onClick={() => creemPreTopUp(product)}
              >
                <div className='text-center'>
                  <div className='font-semibold text-base mb-1'>{product.name}</div>
                  <div className='text-sm mb-2' style={{ color: 'var(--semi-color-text-2)' }}>
                    {t('充值额度')}: {product.quota}
                  </div>
                  <div className='text-lg font-bold' style={{ color: 'var(--semi-color-primary)' }}>
                    {product.currency === 'EUR' ? '€' : '$'}{product.price}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* 兑换码充值 */}
      <Card
        className='mt-3'
        title={
          <div className='flex items-center gap-2'>
            <IconGift />
            {t('兑换码充值')}
          </div>
        }
      >
        <Form initValues={{ redemptionCode: redemptionCode }}>
          <Form.Input
            field='redemptionCode'
            noLabel
            placeholder={t('请输入兑换码')}
            value={redemptionCode}
            onChange={(value) => setRedemptionCode(value)}
            prefix={<IconGift />}
            suffix={
              <Button
                type='primary'
                theme='solid'
                onClick={topUp}
                loading={isSubmitting}
              >
                {t('兑换额度')}
              </Button>
            }
            showClear
            style={{ width: '100%' }}
            extraText={
              topUpLink && (
                <Typography.Text type='tertiary'>
                  {t('在找兑换码？')}
                  <Typography.Text
                    type='secondary'
                    underline
                    className='cursor-pointer'
                    onClick={openTopUpLink}
                  >
                    {t('购买兑换码')}
                  </Typography.Text>
                </Typography.Text>
              )
            }
          />
        </Form>
      </Card>

      {/* 我的订单 */}
      <Card
        className='mt-3'
        title={
          <div className='flex items-center gap-2'>
            <Receipt size={16} />
            {t('我的订单')}
          </div>
        }
      >
        <OrderHistory t={t} />
      </Card>

      {/* 邀请奖励 */}
      <Card
        className='mt-3 mb-4'
        title={
          <div className='flex items-center gap-2'>
            <Gift size={16} />
            {t('邀请奖励')}
            <Typography.Text type='tertiary' size='small'>{t('邀请好友获得额外奖励')}</Typography.Text>
          </div>
        }
      >
        <div className='space-y-4'>
          {/* 收益统计 */}
          <div className='grid grid-cols-3 gap-3'>
            <Card bodyStyle={{ padding: '12px' }} style={{ backgroundColor: 'var(--semi-color-fill-0)' }}>
              <div className='text-center'>
                <div className='text-lg font-bold' style={{ color: 'var(--semi-color-primary)' }}>
                  {renderQuota(userState?.user?.aff_quota || 0)}
                </div>
                <div className='flex items-center justify-center gap-1 mt-1'>
                  <TrendingUp size={12} style={{ color: 'var(--semi-color-text-2)' }} />
                  <span className='text-xs' style={{ color: 'var(--semi-color-text-2)' }}>{t('待使用收益')}</span>
                </div>
              </div>
            </Card>
            <Card bodyStyle={{ padding: '12px' }} style={{ backgroundColor: 'var(--semi-color-fill-0)' }}>
              <div className='text-center'>
                <div className='text-lg font-bold' style={{ color: 'var(--semi-color-text-0)' }}>
                  {renderQuota(userState?.user?.aff_history_quota || 0)}
                </div>
                <div className='flex items-center justify-center gap-1 mt-1'>
                  <BarChart2 size={12} style={{ color: 'var(--semi-color-text-2)' }} />
                  <span className='text-xs' style={{ color: 'var(--semi-color-text-2)' }}>{t('总收益')}</span>
                </div>
              </div>
            </Card>
            <Card bodyStyle={{ padding: '12px' }} style={{ backgroundColor: 'var(--semi-color-fill-0)' }}>
              <div className='text-center'>
                <div className='text-lg font-bold' style={{ color: 'var(--semi-color-text-0)' }}>
                  {userState?.user?.aff_count || 0}
                </div>
                <div className='flex items-center justify-center gap-1 mt-1'>
                  <Users size={12} style={{ color: 'var(--semi-color-text-2)' }} />
                  <span className='text-xs' style={{ color: 'var(--semi-color-text-2)' }}>{t('邀请人数')}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* 邀请链接 */}
          <div>
            <div className='text-sm mb-2' style={{ color: 'var(--semi-color-text-2)' }}>
              {t('邀请链接')}
            </div>
            <Input
              value={affLink}
              readonly
              className='!rounded-lg'
              suffix={
                <Button
                  theme='solid'
                  size='small'
                  icon={<Copy size={14} />}
                  onClick={handleAffLinkClick}
                  className='!rounded-lg'
                >
                  {t('复制')}
                </Button>
              }
            />
          </div>

          {/* 划转按钮 */}
          <div className='flex items-center gap-3'>
            <Button
              theme='solid'
              icon={<Zap size={14} />}
              disabled={!userState?.user?.aff_quota || userState?.user?.aff_quota <= 0}
              onClick={() => setOpenTransfer(true)}
              className='!rounded-lg'
            >
              {t('划转到余额')}
            </Button>
          </div>

          {/* 奖励说明 */}
          <div className='space-y-2'>
            <div className='flex items-start gap-2'>
              <Badge dot type='success' />
              <Typography.Text type='tertiary' size='small'>
                {t('邀请好友注册，好友充值后您可获得相应奖励')}
              </Typography.Text>
            </div>
            <div className='flex items-start gap-2'>
              <Badge dot type='success' />
              <Typography.Text type='tertiary' size='small'>
                {t('通过划转功能将奖励额度转入到您的账户余额中')}
              </Typography.Text>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TopUp;
