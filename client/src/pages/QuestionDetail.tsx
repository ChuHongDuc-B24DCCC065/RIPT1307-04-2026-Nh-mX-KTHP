import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Space, Button, Divider, List, Avatar, Input, message, Row, Col, Spin } from 'antd';
import {
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const API_BASE = 'http://localhost:5000/api';

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);

  // ── Lấy chi tiết câu hỏi từ API ──
  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE}/questions/${id}`, { headers });
      setQuestion(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        message.error('Câu hỏi không tồn tại!');
      } else {
        message.error('Không thể tải câu hỏi!');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [id]);

  // ── Vote / bỏ vote ──
  const handleVote = async () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để thích câu hỏi!');
      return;
    }
    if (voting) return;

    setVoting(true);
    try {
      const res = await axios.post(
        `${API_BASE}/questions/${id}/vote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestion((prev: any) => ({
        ...prev,
        votes: res.data.votes,
        isVoted: res.data.voted,
      }));
      message.success(res.data.message);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể vote!');
    } finally {
      setVoting(false);
    }
  };

  // ── Đăng bình luận ──
  const handlePostComment = async () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để bình luận!');
      return;
    }
    if (!commentText.trim()) {
      message.warning('Vui lòng nhập nội dung bình luận!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE}/questions/${id}/comments`,
        { content: commentText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Thêm bình luận mới vào state
      setQuestion((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), res.data.comment],
        answers: (prev.answers || 0) + 1,
      }));

      message.success('Đã đăng bình luận thành công!');
      setCommentText('');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể đăng bình luận!');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Xóa bình luận ──
  const handleDeleteComment = async (commentId: number) => {
    try {
      await axios.delete(
        `${API_BASE}/questions/${id}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestion((prev: any) => ({
        ...prev,
        comments: prev.comments.filter((c: any) => c.id !== commentId),
        answers: Math.max(0, (prev.answers || 1) - 1),
      }));
      message.success('Đã xóa bình luận!');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể xóa bình luận!');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <Spin size="large" tip="Đang tải câu hỏi..." />
      </div>
    );
  }

  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
        <Title level={3} style={{ color: '#6b7280' }}>Không tìm thấy câu hỏi</Title>
        <Button type="primary" onClick={() => navigate('/')}>Quay lại trang chủ</Button>
      </div>
    );
  }

  const isOwner = user && user.id === question.author_id;
  const isAdmin = user && user.role === 'admin';

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 20 }}
      >
        Quay lại
      </Button>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <Row gutter={24}>
          {/* Cột vote */}
          <Col span={2} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Button
                icon={question.isVoted ? <LikeFilled /> : <LikeOutlined />}
                shape="circle"
                size="large"
                type={question.isVoted ? 'primary' : 'default'}
                onClick={handleVote}
                loading={voting}
              />
              <Text strong style={{ fontSize: 18 }}>{question.votes}</Text>
              <Text type="secondary">Votes</Text>
            </div>
          </Col>

          {/* Nội dung câu hỏi */}
          <Col span={22}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Title level={2} style={{ marginBottom: 16, flex: 1 }}>{question.title}</Title>
              {(isOwner || isAdmin) && (
                <Space style={{ marginLeft: 16, flexShrink: 0 }}>
                  <Button
                    size="small"
                    onClick={() => navigate(`/edit-question/${id}`)}
                  >
                    ✏️ Sửa
                  </Button>
                </Space>
              )}
            </div>

            <Space split={<Divider type="vertical" />} style={{ marginBottom: 20 }}>
              <Space><UserOutlined /> <Text strong>{question.author}</Text></Space>
              <Space><ClockCircleOutlined /> {question.time}</Space>
              <Space><MessageOutlined /> {question.answers} Trả lời</Space>
            </Space>

            <Paragraph style={{ fontSize: 16, lineHeight: '1.8', marginBottom: 24, whiteSpace: 'pre-wrap' }}>
              {question.description}
            </Paragraph>

            <div style={{ marginBottom: 30 }}>
              {(question.tags || []).map((tag: string) => (
                <Tag color="geekblue" key={tag} style={{ padding: '4px 12px', fontSize: 14, borderRadius: 12 }}>#{tag}</Tag>
              ))}
            </div>

            <Divider orientation="left">💬 Bình luận ({question.answers || 0})</Divider>

            {/* Danh sách bình luận */}
            {(question.comments || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                Chưa có bình luận nào. Hãy là người đầu tiên!
              </div>
            ) : (
              <List
                className="comment-list"
                itemLayout="horizontal"
                dataSource={question.comments}
                renderItem={(item: any) => (
                  <List.Item
                    actions={
                      (user && (user.id === item.author_id || isAdmin))
                        ? [<Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteComment(item.id)}
                          />]
                        : []
                    }
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#8b5cf6' }} />}
                      title={
                        <Space>
                          <Text strong>{item.author}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                        </Space>
                      }
                      description={<span style={{ color: '#374151', fontSize: 15 }}>{item.content}</span>}
                    />
                  </List.Item>
                )}
              />
            )}

            {/* Form đăng bình luận */}
            <div style={{ marginTop: 32, background: '#f9fafb', padding: 20, borderRadius: 12, border: '1px solid #f0f0f0' }}>
              <Title level={4} style={{ marginBottom: 16 }}>✏️ Thêm bình luận của bạn</Title>
              {user ? (
                <>
                  <TextArea
                    rows={4}
                    placeholder="Viết suy nghĩ hoặc giải đáp của bạn..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{ marginBottom: 12, borderRadius: 8 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handlePostComment}
                    loading={submitting}
                    size="large"
                    style={{ borderRadius: 8 }}
                  >
                    Gửi bình luận
                  </Button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">Bạn cần </Text>
                  <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>đăng nhập</Button>
                  <Text type="secondary"> để bình luận.</Text>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default QuestionDetail;