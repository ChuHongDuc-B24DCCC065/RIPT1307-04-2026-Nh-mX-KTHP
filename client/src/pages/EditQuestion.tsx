import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Comment {
  id: number;
  author: string;
  content: string;
  time: string;
}

interface Question {
  id: number;
  title: string;
  description: string;
  tags: string[];
  author: string;
  votes: number;
  answers: number;
  time: string;
  comments: Comment[];
}

const EditQuestion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      message.error('Bạn cần đăng nhập để chỉnh sửa câu hỏi!');
      navigate('/login');
      return;
    }

    const localQuestionsStr = localStorage.getItem('questions');
    if (localQuestionsStr) {
      const questionsList: Question[] = JSON.parse(localQuestionsStr);
      const foundQuestion = questionsList.find(q => q.id === Number(id));
      
      if (foundQuestion) {
        // Chỉ cho phép tác giả hoặc admin sửa câu hỏi
        if (foundQuestion.author === user.username || user.role === 'admin' || (user.username === 'admin' && foundQuestion.author === 'Chu Hong Duc')) {
          setQuestion(foundQuestion);
          form.setFieldsValue({
            title: foundQuestion.title,
            description: foundQuestion.description,
            tags: foundQuestion.tags
          });
        } else {
          message.error('Bạn không có quyền chỉnh sửa câu hỏi này!');
          navigate('/profile');
        }
      } else {
        message.error('Không tìm thấy câu hỏi!');
        navigate('/profile');
      }
    } else {
      message.error('Không tìm thấy câu hỏi!');
      navigate('/profile');
    }
  }, [id, navigate, form]);

  const onFinish = (values: any) => {
    setLoading(true);
    
    const localQuestionsStr = localStorage.getItem('questions');
    if (localQuestionsStr) {
      const questionsList: Question[] = JSON.parse(localQuestionsStr);
      const updatedQuestions = questionsList.map(q => {
        if (q.id === Number(id)) {
          return {
            ...q,
            title: values.title,
            description: values.description,
            tags: values.tags
          };
        }
        return q;
      });

      localStorage.setItem('questions', JSON.stringify(updatedQuestions));

      setTimeout(() => {
        setLoading(false);
        message.success('Cập nhật câu hỏi thành công!');
        navigate(`/questions/${id}`);
      }, 1000);
    } else {
      setLoading(false);
      message.error('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="secondary">Đang tải thông tin câu hỏi...</Text>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space style={{ marginBottom: 20 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/profile')}
          type="text"
        >
          Quay lại hồ sơ
        </Button>
      </Space>

      <Card>
        <Title level={2} style={{ marginBottom: 30 }}>Chỉnh sửa câu hỏi</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
          Cập nhật các thông tin của câu hỏi để nhận được câu trả lời tốt nhất.
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
            <Input placeholder="Tiêu đề câu hỏi..." size="large" />
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
              placeholder="Mô tả chi tiết vấn đề của bạn..." 
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
                { value: 'reactjs', label: 'ReactJS' },
                { value: 'nodejs', label: 'NodeJS' },
                { value: 'javascript', label: 'JavaScript' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'mysql', label: 'MySQL' },
                { value: 'mongodb', label: 'MongoDB' },
                { value: 'css', label: 'CSS' },
                { value: 'html', label: 'HTML' },
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
