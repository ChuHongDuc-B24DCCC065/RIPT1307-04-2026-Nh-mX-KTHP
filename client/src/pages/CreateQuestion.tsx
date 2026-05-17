import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Space } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = (values: any) => {
    setLoading(true);
    
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    const initialQuestions = [
      {
        id: 1,
        title: 'Làm thế nào để cấu hình React Router trong Vite?',
        description: 'Mình đã cài đặt react-router-dom nhưng khi tải lại trang trên Netlify thì bị lỗi 404. Mình đã thử thêm file _redirects nhưng vẫn không được. Có ai gặp trường hợp này chưa ạ?',
        tags: ['reactjs', 'vite', 'frontend'],
        author: 'Chu Hong Duc',
        votes: 15,
        answers: 3,
        time: '2 giờ trước',
        comments: [
          {
            id: 101,
            author: 'Nguyen Van A',
            content: 'Bạn kiểm tra lại file netlify.toml xem đã cấu hình redirect đúng chưa nhé.',
            time: '1 giờ trước'
          },
          {
            id: 102,
            author: 'Tran Thi B',
            content: 'Nếu dùng Vite, hãy chắc chắn rằng bạn đã build đúng thư mục dist.',
            time: '30 phút trước'
          }
        ]
      },
      {
        id: 2,
        title: 'Cách kết nối Node.js với MySQL sử dụng Sequelize',
        description: 'Em đang làm bài tập lớn về diễn đàn, cần hướng dẫn kết nối database MySQL bằng Sequelize ORM. Em đã cài đặt các package cần thiết nhưng khi chạy thì báo lỗi dialect not specified.',
        tags: ['nodejs', 'mysql', 'backend'],
        author: 'SinhVienIT',
        votes: 8,
        answers: 1,
        time: '5 giờ trước',
        comments: [
          {
            id: 201,
            author: 'Admin',
            content: 'Bạn cần khai báo dialect: "mysql" trong cấu hình của Sequelize nhé.',
            time: '4 giờ trước'
          }
        ]
      },
    ];

    const localQuestionsStr = localStorage.getItem('questions');
    let questionsList = localQuestionsStr ? JSON.parse(localQuestionsStr) : initialQuestions;
    
    const newId = Date.now();
    const newQuestion = {
      id: newId,
      title: values.title,
      description: values.description,
      tags: values.tags || [],
      author: user?.username || 'Ẩn danh',
      votes: 0,
      answers: 0,
      time: 'Vừa xong',
      comments: []
    };

    questionsList = [newQuestion, ...questionsList];
    localStorage.setItem('questions', JSON.stringify(questionsList));

    setTimeout(() => {
      setLoading(false);
      message.success('Đã đăng câu hỏi thành công!');
      navigate(`/questions/${newId}`);
    }, 1000);
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

      <Card>
        <Title level={2} style={{ marginBottom: 30 }}>Đặt câu hỏi mới</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
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
            <Input placeholder="Ví dụ: Làm thế nào để sử dụng React Hooks hiệu quả?" size="large" />
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
              icon={<SendOutlined />} 
              loading={loading}
              block
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
