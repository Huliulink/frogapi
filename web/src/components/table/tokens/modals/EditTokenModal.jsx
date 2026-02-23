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
  showSuccess,
  timestamp2string,
  renderGroupOption,
  getQuotaPerUnit,
  getModelCategories,
  selectFilter,
} from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  Button,
  Modal,
  Spin,
  Form,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../../../context/Status';

const fieldItemStyle = {
  padding: '4px 20px',
};

const EditTokenModal = (props) => {
  const { t } = useTranslation();
  const [statusState, statusDispatch] = useContext(StatusContext);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const formApiRef = useRef(null);
  const [models, setModels] = useState([]);
  const [groups, setGroups] = useState([]);
  const isEdit = props.editingToken.id !== undefined;
  const quotaPerUnit = getQuotaPerUnit() || 500000;

  const getInitValues = () => ({
    name: '',
    remain_quota: 0,
    expired_time: '',
    never_expire: false,
    unlimited_quota: true,
    model_limits_enabled: false,
    model_limits: [],
    allow_ips: '',
    group: '',
    cross_group_retry: false,
    tokenCount: 1,
  });

  const handleCancel = () => {
    props.handleClose();
  };

  const loadModels = async () => {
    let res = await API.get(`/api/user/models`);
    const { success, message, data } = res.data;
    if (success) {
      const categories = getModelCategories(t);
      let localModelOptions = data.map((model) => {
        let icon = null;
        for (const [key, category] of Object.entries(categories)) {
          if (key !== 'all' && category.filter({ model_name: model })) {
            icon = category.icon;
            break;
          }
        }
        return {
          label: (
            <span className='flex items-center gap-1'>
              {icon}
              {model}
            </span>
          ),
          value: model,
        };
      });
      setModels(localModelOptions);
    } else {
      showError(t(message));
    }
  };

  const loadGroups = async () => {
    let res = await API.get(`/api/user/self/groups`);
    const { success, message, data } = res.data;
    if (success) {
      let localGroupOptions = Object.entries(data).map(([group, info]) => ({
        label: info.desc,
        value: group,
        ratio: info.ratio,
      }));
      if (statusState?.status?.default_use_auto_group) {
        if (localGroupOptions.some((group) => group.value === 'auto')) {
          localGroupOptions.sort((a, b) => (a.value === 'auto' ? -1 : 1));
        }
      }
      setGroups(localGroupOptions);
      // if (statusState?.status?.default_use_auto_group && formApiRef.current) {
      //   formApiRef.current.setValue('group', 'auto');
      // }
    } else {
      showError(t(message));
    }
  };

  const loadToken = async () => {
    setLoading(true);
    let res = await API.get(`/api/token/${props.editingToken.id}`);
    const { success, message, data } = res.data;
    if (success) {
      if (data.expired_time === -1) {
        data.never_expire = true;
        data.expired_time = '';
      } else {
        data.never_expire = false;
        data.expired_time = timestamp2string(data.expired_time);
      }
      if (data.model_limits !== '') {
        data.model_limits = data.model_limits.split(',');
      } else {
        data.model_limits = [];
      }
      data.remain_quota = parseFloat((data.remain_quota / quotaPerUnit).toFixed(2));
      if (formApiRef.current) {
        formApiRef.current.setValues({ ...getInitValues(), ...data });
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formApiRef.current) {
      if (!isEdit) {
        formApiRef.current.setValues(getInitValues());
      }
    }
    loadModels();
    loadGroups();
  }, [props.editingToken.id]);

  useEffect(() => {
    if (props.visiable) {
      if (isEdit) {
        loadToken();
      } else {
        formApiRef.current?.setValues(getInitValues());
      }
    } else {
      formApiRef.current?.reset();
    }
  }, [props.visiable, props.editingToken.id]);

  const generateRandomSuffix = () => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  const submit = async (values) => {
    setLoading(true);
    if (isEdit) {
      let { tokenCount: _tc, never_expire, ...localInputs } = values;
      localInputs.remain_quota = Math.round(parseFloat(localInputs.remain_quota) * quotaPerUnit);
      if (never_expire) {
        localInputs.expired_time = -1;
      } else {
        let time = Date.parse(localInputs.expired_time);
        if (isNaN(time)) {
          showError(t('过期时间格式错误！'));
          setLoading(false);
          return;
        }
        localInputs.expired_time = Math.ceil(time / 1000);
      }
      localInputs.model_limits = localInputs.model_limits.join(',');
      localInputs.model_limits_enabled = localInputs.model_limits.length > 0;
      let res = await API.put(`/api/token/`, {
        ...localInputs,
        id: parseInt(props.editingToken.id),
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('令牌更新成功！'));
        props.refresh();
        props.handleClose();
      } else {
        showError(t(message));
      }
    } else {
      const count = parseInt(values.tokenCount, 10) || 1;
      let successCount = 0;
      for (let i = 0; i < count; i++) {
        let { tokenCount: _tc, never_expire, ...localInputs } = values;
        const baseName =
          values.name.trim() === '' ? 'default' : values.name.trim();
        if (i !== 0 || values.name.trim() === '') {
          localInputs.name = `${baseName}-${generateRandomSuffix()}`;
        } else {
          localInputs.name = baseName;
        }
        localInputs.remain_quota = Math.round(parseFloat(localInputs.remain_quota) * quotaPerUnit);

        if (never_expire) {
          localInputs.expired_time = -1;
        } else {
          let time = Date.parse(localInputs.expired_time);
          if (isNaN(time)) {
            showError(t('过期时间格式错误！'));
            setLoading(false);
            break;
          }
          localInputs.expired_time = Math.ceil(time / 1000);
        }
        localInputs.model_limits = localInputs.model_limits.join(',');
        localInputs.model_limits_enabled = localInputs.model_limits.length > 0;
        let res = await API.post(`/api/token/`, localInputs);
        const { success, message } = res.data;
        if (success) {
          successCount++;
        } else {
          showError(t(message));
          break;
        }
      }
      if (successCount > 0) {
        showSuccess(t('令牌创建成功，请在列表页面点击复制获取令牌！'));
        props.refresh();
        props.handleClose();
      }
    }
    setLoading(false);
    formApiRef.current?.setValues(getInitValues());
  };

  return (
    <Modal
      title={
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          {isEdit ? t('更新令牌信息') : t('创建新的令牌')}
        </span>
      }
      visible={props.visiable}
      onCancel={() => handleCancel()}
      centered
      width={isMobile ? '95vw' : 520}
      bodyStyle={{
        padding: 0,
        maxHeight: '70vh',
        overflowY: 'auto',
      }}
      style={{ borderRadius: '12px', overflow: 'hidden' }}
      footer={
        <div className='flex justify-between items-center' style={{ padding: '4px 0' }}>
          <Button
            theme='borderless'
            type='tertiary'
            onClick={handleCancel}
            style={{ fontSize: 14, color: '#1C1F23' }}
          >
            {t('取消')}
          </Button>
          <Button
            theme='solid'
            style={{
              borderRadius: 8,
              fontSize: 14,
              padding: '6px 24px',
              background: '#ea580c',
              borderColor: '#ea580c',
            }}
            onClick={() => formApiRef.current?.submitForm()}
            loading={loading}
          >
            {isEdit ? t('更新令牌') : t('创建令牌')}
          </Button>
        </div>
      }
      closable={true}
    >
      <Spin spinning={loading}>
        <Form
          key={isEdit ? 'edit' : 'new'}
          initValues={getInitValues()}
          getFormApi={(api) => (formApiRef.current = api)}
          onSubmit={submit}
          labelPosition='inset'
          className='edit-token-flat-form'
        >
          {({ values }) => (
            <>
              <div style={fieldItemStyle}>
                <Form.Input
                  field='name'
                  label={t('名称')}
                  placeholder={t('请输入名称')}
                  rules={[{ required: true, message: t('请输入名称') }]}
                  showClear
                  style={{ width: '100%' }}
                />
              </div>

              <div style={fieldItemStyle}>
                {groups.length > 0 ? (
                  <Form.Select
                    field='group'
                    label={t('令牌分组')}
                    placeholder={t('令牌分组，默认为用户的分组')}
                    optionList={groups}
                    renderOptionItem={renderGroupOption}
                    showClear
                    style={{ width: '100%' }}
                  />
                ) : (
                  <Form.Select
                    placeholder={t('管理员未设置用户可选分组')}
                    disabled
                    label={t('令牌分组')}
                    style={{ width: '100%' }}
                  />
                )}
              </div>

              {values.group === 'auto' && (
                <div style={fieldItemStyle}>
                  <Form.Switch
                    field='cross_group_retry'
                    label={t('跨分组重试')}
                    labelPosition='left'
                    size='default'
                    extraText={t(
                      '开启后，当前分组渠道失败时会按顺序尝试下一个分组的渠道',
                    )}
                  />
                </div>
              )}

              <div style={fieldItemStyle}>
                <div className='flex items-center gap-3'>
                  <div style={{ flex: 1 }}>
                    <Form.DatePicker
                      field='expired_time'
                      label={t('过期时间')}
                      type='dateTime'
                      placeholder={t('年/月/日—:—')}
                      disabled={values.never_expire}
                      rules={values.never_expire ? [] : [
                        { required: true, message: t('请选择过期时间') },
                        {
                          validator: (rule, value) => {
                            if (!value) return Promise.resolve();
                            const time = Date.parse(value);
                            if (isNaN(time)) {
                              return Promise.reject(t('过期时间格式错误！'));
                            }
                            if (time <= Date.now()) {
                              return Promise.reject(
                                t('过期时间不能早于当前时间！'),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      showClear
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <Form.Switch
                      field='never_expire'
                      label={t('永不过期')}
                      labelPosition='left'
                      size='default'
                      noLabel={false}
                    />
                  </div>
                </div>
              </div>

              {!isEdit && (
                <div style={fieldItemStyle}>
                  <Form.InputNumber
                    field='tokenCount'
                    label={t('新建数量')}
                    min={1}
                    extraText={t('批量创建时会在名称后自动添加随机后缀')}
                    rules={[
                      { required: true, message: t('请输入新建数量') },
                    ]}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div style={fieldItemStyle}>
                <div className='flex items-center gap-3'>
                  <div style={{ flex: 1 }}>
                    <Form.AutoComplete
                      field='remain_quota'
                      label={t('额度')}
                      placeholder={t('请输入金额')}
                      prefix='$'
                      disabled={values.unlimited_quota}
                      rules={
                        values.unlimited_quota
                          ? []
                          : [{ required: true, message: t('请输入额度') }]
                      }
                      data={[
                        { value: 1, label: '1$' },
                        { value: 10, label: '10$' },
                        { value: 50, label: '50$' },
                        { value: 100, label: '100$' },
                        { value: 500, label: '500$' },
                        { value: 1000, label: '1000$' },
                      ]}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <Form.Switch
                      field='unlimited_quota'
                      label={t('无限额度')}
                      labelPosition='left'
                      size='default'
                      noLabel={false}
                    />
                  </div>
                </div>
              </div>

              <div style={fieldItemStyle}>
                <Form.Select
                  field='model_limits'
                  label={t('模型限制列表')}
                  placeholder={t(
                    '请选择该令牌支持的模型，留空支持所有模型',
                  )}
                  multiple
                  optionList={models}
                  extraText={t('非必要，不建议启用模型限制')}
                  filter={selectFilter}
                  autoClearSearchValue={false}
                  searchPosition='dropdown'
                  showClear
                  style={{ width: '100%' }}
                />
              </div>

              <div style={fieldItemStyle}>
                <Form.TextArea
                  field='allow_ips'
                  label={t('IP白名单（支持CIDR表达式）')}
                  placeholder={t('允许的IP，一行一个，不填写则不限制')}
                  autosize
                  rows={1}
                  extraText={t(
                    '请勿过度信任此功能，IP可能被伪造，请配合nginx和cdn等网关使用',
                  )}
                  showClear
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
        </Form>
      </Spin>
    </Modal>
  );
};

export default EditTokenModal;
