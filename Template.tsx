import { useMutation } from '@tanstack/react-query';
import { Button, Checkbox, Col, Form, Input, Row, Tag, Typography, TagProps } from 'antd';
import { AxiosError } from 'axios';
import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ROUTES from 'constants/routes';
import ArrowLeftIcon from 'images/arrow-left.svg';
import PenIcon from 'images/pen-icon.svg';
import Api from 'services/api';
import { CreateTemplateData, DocumentTemplate, DocumentType, EmailTemplate, TemplateStatus } from 'types/Template';
import styles from './Template.scss';

const TAG_COLORS = {
  ATTACHMENTS_TAG: '#1C7BC2',
  SOURCES_TAG: '#DE7260',
  PROPERTIES_TAG: '#78B722',
};

const ATTACHMENTS_OPTIONS = [{ value: 0, label: 'No attachments' }];
const SOURCES_OPTIONS = [{ value: 0, label: 'All' }];
const PROPERTIES_OPTIONS = [{ value: 0, label: 'All' }];
const TEMPLATE_STATUSES = [
  { value: TemplateStatus.Active, label: 'Active' },
  { value: TemplateStatus.Inactive, label: 'Inactive' },
];
const DOCUMENT_TYPE_OPTIONS = [
  { value: DocumentType.CustomDocument, label: 'Custom Document' },
  { value: DocumentType.GuestRegistrationForm, label: 'Guest Registration Form' },
  { value: DocumentType.GuestStatement, label: 'Guest Statement' },
];

const renderTag = (color: string) =>
  function ColoredTag({ closable, onClose, label }: TagProps & { label: ReactNode }) {
    return (
      <Tag color={color} closable={closable} onClose={onClose}>
        {label}
      </Tag>
    );
  };

export default function Template() {
  const navigate = useNavigate();
  const location = useLocation();
  const propertyId = useSelectedProperty();

  const isEmail = location.pathname.includes('email');
  const {
    mutate: createTemplate,
    isLoading: isCreateTemplateLoading,
    error: createTemplateError,
  } = useMutation<unknown, AxiosError, CreateTemplateData>({
    mutationFn: Api.createTemplate,
    onSuccess: () => navigate(ROUTES.TEMPLATES),
  });

  const isNamingError = createTemplateError?.response?.status === 422;

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);

  function handleFinish(data: EmailTemplate | DocumentTemplate) {
    setIsFormValid(true);
    // @TODO: hardcoded values will be fixed in future story
    createTemplate({
      data: { ...data, pmsPropertyIds: [propertyId as number], pmsSourceIds: [], content: 'some message' },
      isEmail,
    });
  }

  function handleFinishEmailSubject({ modalEmailSubject }: { modalEmailSubject: string }) {
    form.setFieldValue('emailSubject', modalEmailSubject);
    setIsModalOpen(false);
  }

  const { id: templateId } = useParams();
  const documentTemplateTitle = templateId?.includes('new') ? 'Create a Document' : `Edit Document: ${templateId}`;
  const emailTemplateTitle = templateId?.includes('new') ? 'Create an Email' : `Edit Email: ${templateId}`;

  return (
    <div>
      <Link to={ROUTES.TEMPLATES} className={styles.backLink}>
        <ArrowLeftIcon />
        Back
      </Link>
      <Modal
        width={780}
        title="Email Subject"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        okButtonProps={{ htmlType: 'submit', form: 'email-subject-form' }}
        okText="Save"
        closable
      >
        <Form onFinish={handleFinishEmailSubject} id="email-subject-form">
          <Form.Item name="modalEmailSubject">
            <Input.TextArea autoSize={{ minRows: 8 }} maxLength={900} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Form
        layout="vertical"
        onFinish={handleFinish}
        onFinishFailed={() => setIsFormValid(false)}
        validateTrigger="onSubmit"
        form={form}
      >
        <Row justify="space-between" align="bottom">
          <Col>
            <Typography.Title className={styles.templateTitle} level={1}>
              {isEmail ? emailTemplateTitle : documentTemplateTitle}
            </Typography.Title>
          </Col>
          <Button type="primary" htmlType="submit" loading={isCreateTemplateLoading}>
            Save
          </Button>
        </Row>
        {isNamingError && (
          <Alert
            className={styles.alert}
            type="error"
            messages={[
              'There is already a template named Registration Card. Please use a different name and save again',
            ]}
          />
        )}
        {!isFormValid && (
          <Alert className={styles.alert} type="error" messages={['All the below fields are required']} />
        )}
        <div className={styles.formBody}>
          <Typography.Title level={3}>Details</Typography.Title>
          <Row gutter={50}>
            <Col xs={12}>
              <Form.Item
                name="name"
                rules={[{ type: 'string', required: true, message: 'Name is required' }]}
                label="Name"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={7}>
              <Form.Item name="status" label="Status" initialValue={TemplateStatus.Active}>
                <Select options={TEMPLATE_STATUSES} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="isDefault" label="Default Template" valuePropName="checked" initialValue={false}>
                <Checkbox />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={50}>
            <Col xs={12}>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} maxLength={510} showCount />
              </Form.Item>
            </Col>
            <Col xs={7}>
              {isEmail ? (
                <Form.Item
                  name="emailSubject"
                  rules={[{ required: true, message: 'Email Subject is required' }]}
                  label="Email Subject"
                >
                  <Input onClick={() => setIsModalOpen(true)} suffix={<PenIcon />} readOnly />
                </Form.Item>
              ) : (
                <Form.Item name="documentType" label="Document Type" initialValue={DocumentType.CustomDocument}>
                  <Select options={DOCUMENT_TYPE_OPTIONS} />
                </Form.Item>
              )}
            </Col>
          </Row>
          {isEmail && (
            <Form.Item name="attachedDocumentTemplateIds" label="Attachments">
              <Select
                options={ATTACHMENTS_OPTIONS}
                tagRender={renderTag(TAG_COLORS.ATTACHMENTS_TAG)}
                size="large"
                mode="multiple"
                showArrow={false}
              />
            </Form.Item>
          )}
          <Form.Item name="pmsSourceIds" rules={[{ required: true, message: 'Sources are required' }]} label="Sources">
            <Select
              options={SOURCES_OPTIONS}
              tagRender={renderTag(TAG_COLORS.SOURCES_TAG)}
              size="large"
              mode="multiple"
              showArrow={false}
            />
          </Form.Item>
          <Form.Item
            name="pmsPropertyIds"
            rules={[{ required: true, message: 'Properties are required' }]}
            label="Properties"
          >
            <Select
              options={PROPERTIES_OPTIONS}
              tagRender={renderTag(TAG_COLORS.PROPERTIES_TAG)}
              size="large"
              mode="multiple"
              showArrow={false}
            />
          </Form.Item>
        </div>
      </Form>
    </div>
  );
}
