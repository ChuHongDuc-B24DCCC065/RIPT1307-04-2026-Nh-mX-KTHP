import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const { TextArea } = Input;

const API_BASE = 'http://localhost:5000/api';

const EditQuestion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!user || !token) {
      message.error('Bạn cần đăng nhập để chỉnh sửa câu hỏi!');
      navigate('/login');
      return;
    }

    // Lấy thông tin câu hỏi từ API
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`${API_BASE}/questions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const q = res.data;

        // Kiểm tra quyền sở hữu
        if (q.author_id !== user.id && user.role !== 'admin') {
          message.error('Bạn không có quyền chỉnh sửa câu hỏi này!');
          navigate('/profile');
          return;
        }

        form.setFieldsValue({
          title:       q.title,
          description: q.description,
          tags:        q.tags || [],
        });
      } catch (err: any) {
        message.error('Không tìm thấy câu hỏi!');
        navigate('/profile');
      } finally {
        setFetching(false);
      }
    };

    fetchQuestion();
  }, [id]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await axios.put(
        `${API_BASE}/questions/${id}`,
        {
          title:       values.title,
          description: values.description,
          tags:        values.tags || [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('Cập nhật câu hỏi thành công!');
      navigate(`/questions/${id}`);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể cập nhật câu hỏi!');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <Spin size="large" tip="Đang tải câu hỏi..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 20 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/questions/${id}`)}
          type="text"
        >
          Quay lại câu hỏi
        </Button>
      </Space>

      <Card style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <Title level={2} style={{ marginBottom: 8 }}>✏️ Chỉnh sửa câu hỏi</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
          Cập nhật các thông tin của câu hỏi để nhận được câu trả lời tốt nhất.
        </Text>

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label="Tiêu đề câu hỏi"
            name="title"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề!' },
              { min: 10, message: 'Tiêu đề quá ngắn (tối thiểu 10 ký tự)!' }
            ]}
          >
            <Input placeholder="Tiêu đề câu hỏi..." size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            label="Nội dung chi tiết"
            name="description"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung chi tiết!' },
              { min: 20, message: 'Nội dung quá ngắn (tối thiểu 20 ký tự)!' }
            ]}
          >
            <TextArea rows={8} placeholder="Mô tả chi tiết vấn đề của bạn..." style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            label="Gắn thẻ (Tags)"
            name="tags"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một thẻ!' }]}
          >
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Chọn hoặc nhập thẻ..."
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
              icon={<SaveOutlined />}
              loading={loading}
              block
              style={{ borderRadius: 8, height: 48, fontWeight: 600, fontSize: 16 }}
            >
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditQuestion;
