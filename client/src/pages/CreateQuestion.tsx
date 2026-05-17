import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_BASE = 'http://localhost:5000/api';

const CreateQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Bạn cần đăng nhập để đặt câu hỏi!');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/questions`,
        {
          title: values.title,
          description: values.description,
          tags: values.tags || [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('Đã đăng câu hỏi thành công!');
      navigate(`/questions/${res.data.question.id}`);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể đăng câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          type="text"
        >
          Quay lại trang chủ
        </Button>
      </Space>

      <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Title level={2} style={{ marginBottom: 8 }}>💡 Đặt câu hỏi mới</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
          Hãy mô tả chi tiết vấn đề của bạn để cộng đồng có thể hỗ trợ tốt nhất.
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Tiêu đề câu hỏi"
            name="title"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề!' },
              { min: 10, message: 'Tiêu đề quá ngắn (tối thiểu 10 ký tự)!' }
            ]}
          >
            <Input
              placeholder="Ví dụ: Làm thế nào để sử dụng React Hooks hiệu quả?"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label="Nội dung chi tiết"
            name="description"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung chi tiết!' },
              { min: 20, message: 'Nội dung quá ngắn (tối thiểu 20 ký tự)!' }
            ]}
          >
            <TextArea
              rows={8}
              placeholder="Mô tả chi tiết vấn đề, những gì bạn đã thử và kết quả mong muốn..."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            label="Gắn thẻ (Tags)"
            name="tags"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thẻ!' }]}
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Chọn hoặc nhập thẻ (ví dụ: reactjs, javascript...)"
              options={[
                { value: 'reactjs',    label: 'ReactJS' },
                { value: 'nodejs',     label: 'NodeJS' },
                { value: 'javascript', label: 'JavaScript' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'mysql',      label: 'MySQL' },
                { value: 'mongodb',    label: 'MongoDB' },
                { value: 'css',        label: 'CSS' },
                { value: 'html',       label: 'HTML' },
                { value: 'python',     label: 'Python' },
                { value: 'java',       label: 'Java' },
                { value: 'backend',    label: 'Backend' },
                { value: 'frontend',   label: 'Frontend' },
              ]}
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 40 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SendOutlined />}
              loading={loading}
              block
              style={{
                borderRadius: 8,
                height: 48,
                fontWeight: 600,
                fontSize: 16,
                background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)'
              }}
            >
              Đăng câu hỏi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateQuestion;
