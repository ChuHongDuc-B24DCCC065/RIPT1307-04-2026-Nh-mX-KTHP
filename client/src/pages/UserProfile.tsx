import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Row, Col, Avatar, Button, Tabs, List, Space, Tag, Modal, Form, Input, message, Spin } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, MailOutlined, IdcardOutlined, MessageOutlined, ClockCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const API_BASE = 'http://localhost:5000/api';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const token = localStorage.getItem('token');

  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // ── Lấy câu hỏi của user từ API ──
  const fetchMyQuestions = useCallback(async () => {
    if (!user) return;
    setLoadingQuestions(true);
    try {
      const res = await axios.get(`${API_BASE}/questions/user/${user.id}`);
      setQuestions(res.data.questions || []);
    } catch {
      // Nếu API lỗi, hiện danh sách rỗng
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyQuestions();
  }, [fetchMyQuestions]);

  if (!user) return null;

  // ── Cập nhật thông tin cá nhân qua API ──
  const handleUpdateProfile = async (values: any) => {
    setSavingProfile(true);
    try {
      const res = await axios.put(
        `${API_BASE}/users/me`,
        { username: values.username, email: values.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = { ...user, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      message.success('Cập nhật thông tin thành công!');
      setIsEditModalVisible(false);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể cập nhật thông tin!');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Đổi mật khẩu qua API ──
  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Xác nhận mật khẩu không khớp!');
      return;
    }
    setSavingPassword(true);
    try {
      await axios.put(
        `${API_BASE}/users/me/change-password`,
        { currentPassword: values.currentPassword, newPassword: values.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('Đổi mật khẩu thành công!');
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể đổi mật khẩu!');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Xóa câu hỏi qua API ──
  const handleDeleteQuestion = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.delete(`${API_BASE}/questions/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setQuestions(prev => prev.filter(q => q.id !== id));
          message.success('Đã xóa câu hỏi thành công!');
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Không thể xóa câu hỏi!');
        }
      }
    });
  };

  const tabItems = [
    {
      key: '1',
      label: <span><MessageOutlined /> Câu hỏi của tôi ({questions.length})</span>,
      children: loadingQuestions ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
      ) : (
        <List
          itemLayout="vertical"
          size="large"
          dataSource={questions}
          locale={{ emptyText: 'Bạn chưa đăng câu hỏi nào.' }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{ padding: '20px 0' }}
              actions={[
                <Space><MessageOutlined /> {item.answers} Trả lời</Space>,
                <Space><ClockCircleOutlined /> {item.time || 'N/A'}</Space>,
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/edit-question/${item.id}`)}
                  style={{ color: '#1890ff' }}
                >
                  Sửa
                </Button>,
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteQuestion(item.id)}
                >
                  Xóa
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Link to={`/questions/${item.id}`} style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {item.title}
                  </Link>
                }
                description={
                  <Space wrap>
                    {(item.tags || []).map((tag: string) => <Tag key={tag} color="geekblue">#{tag}</Tag>)}
                  </Space>
                }
              />
              <div style={{ color: '#555', marginTop: 10 }}>
                {item.description?.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
              </div>
            </List.Item>
          )}
        />
      ),
    },
    {
      key: '2',
      label: <span><ClockCircleOutlined /> Hoạt động gần đây</span>,
      children: (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Text type="secondary">Tính năng đang được phát triển...</Text>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      <Row gutter={24}>
        {/* Cột trái: Thông tin cá nhân */}
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            cover={<div style={{ height: 120, background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)', borderRadius: '8px 8px 0 0' }} />}
            style={{ textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px' }}
          >
            <Avatar
              size={100}
              icon={<UserOutlined />}
              style={{ marginTop: -50, border: '4px solid white', backgroundColor: '#8b5cf6', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            />
            <Title level={3} style={{ marginTop: 15, marginBottom: 5 }}>{user.username}</Title>
            <Tag color={user.role === 'admin' ? 'red' : user.role === 'teacher' ? 'magenta' : 'blue'} style={{ marginBottom: 20 }}>
              {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Giảng viên' : 'Sinh viên'}
            </Tag>

            <div style={{ textAlign: 'left', marginTop: 20, padding: '0 10px' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><MailOutlined /> EMAIL</Text>
                  <Text strong>{user.email || 'Chưa cập nhật'}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}><IdcardOutlined /> HỌ TÊN</Text>
                  <Text strong>{user.fullName || user.username}</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>📝 CÂU HỎI ĐÃ ĐĂNG</Text>
                  <Text strong style={{ color: '#1890ff', fontSize: 18 }}>{questions.length}</Text>
                </div>
              </Space>

              <Button
                type="primary"
                block
                icon={<EditOutlined />}
                style={{ marginTop: 20, height: '40px', borderRadius: '6px' }}
                onClick={() => {
                  profileForm.setFieldsValue({ username: user.username, email: user.email || '' });
                  setIsEditModalVisible(true);
                }}
              >
                Chỉnh sửa hồ sơ
              </Button>

              <Button
                block
                icon={<LockOutlined />}
                style={{ marginTop: 12, height: '40px', borderRadius: '6px' }}
                onClick={() => setIsPasswordModalVisible(true)}
              >
                Đổi mật khẩu
              </Button>
            </div>
          </Card>
        </Col>

        {/* Cột phải: Tabs */}
        <Col xs={24} md={16}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <Tabs defaultActiveKey="1" size="large" items={tabItems} />
          </Card>
        </Col>
      </Row>

      {/* Modal Chỉnh sửa hồ sơ */}
      <Modal
        title="Cập nhật thông tin cá nhân"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        centered
        destroyOnClose
      >
        <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input placeholder="Tên đăng nhập" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không đúng định dạng!' }
            ]}
          >
            <Input placeholder="example@student.ptit.edu.vn" size="large" />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => setIsEditModalVisible(false)} style={{ marginRight: 10 }}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" size="large" loading={savingProfile}>Lưu thay đổi</Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Đổi mật khẩu */}
      <Modal
        title="🔒 Đổi mật khẩu"
        open={isPasswordModalVisible}
        onCancel={() => { setIsPasswordModalVisible(false); passwordForm.resetFields(); }}
        footer={null}
        centered
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu hiện tại" size="large" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 6, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" size="large" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu mới!' }]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" size="large" />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 20 }}>
            <Button onClick={() => { setIsPasswordModalVisible(false); passwordForm.resetFields(); }} style={{ marginRight: 10 }}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" size="large" loading={savingPassword}>Đổi mật khẩu</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
