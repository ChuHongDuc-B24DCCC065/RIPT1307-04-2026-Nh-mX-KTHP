import React, { useState, useEffect, useCallback } from 'react';
import { List, Tag, Space, Button, Row, Col, Typography, Card, message, Spin, Input, Select } from 'antd';
import { MessageOutlined, LikeOutlined, UserOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;

const API_BASE = 'http://localhost:5000/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [stats, setStats] = useState({ totalQuestions: 0, totalUsers: 0 });

  // ── Fetch danh sách câu hỏi từ API ──
  const fetchQuestions = useCallback(async (search = '', sort = 'newest') => {
    setLoading(true);
    try {
      const params: any = { sort };
      if (search.trim()) params.search = search.trim();

      const res = await axios.get(`${API_BASE}/questions`, { params });
      setQuestions(res.data.questions || []);
      setStats(prev => ({ ...prev, totalQuestions: res.data.pagination?.total || 0 }));
    } catch (err: any) {
      message.error('Không thể tải danh sách câu hỏi!');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch thống kê ──
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await axios.get(`${API_BASE}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(prev => ({ ...prev, totalUsers: res.data.totalUsers || 0 }));
      }
    } catch {
      // Bỏ qua nếu không phải admin
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
    fetchStats();
  }, [fetchQuestions, fetchStats]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    fetchQuestions(value, sortBy);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    fetchQuestions(searchValue, value);
  };

  const handleCreateQuestion = () => {
    if (!user) {
      message.warning('Bạn cần đăng nhập để đặt câu hỏi!');
      navigate('/login');
    } else {
      navigate('/create-question');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Row gutter={[24, 24]} style={{ flex: 1, overflow: 'hidden' }}>
        {/* Cột trái: Danh sách câu hỏi */}
        <Col xs={24} lg={18} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: '2px solid #f0f0f0'
          }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>
              🔥 Khám phá & Hỏi đáp
            </Title>
            <Button
              type="primary"
              size="large"
              onClick={handleCreateQuestion}
              style={{
                background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
                border: 'none',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0, 201, 255, 0.3)',
                borderRadius: '8px'
              }}
            >
              + Đặt câu hỏi
            </Button>
          </div>

          {/* Thanh tìm kiếm & Sắp xếp */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <Search
              placeholder="Tìm kiếm câu hỏi..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ flex: 1 }}
            />
            <Select
              value={sortBy}
              onChange={handleSortChange}
              size="large"
              style={{ width: 160 }}
              options={[
                { value: 'newest',  label: '🕐 Mới nhất' },
                { value: 'votes',   label: '👍 Nhiều vote' },
                { value: 'answers', label: '💬 Nhiều trả lời' },
              ]}
            />
          </div>

          {/* Danh sách câu hỏi */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', paddingTop: 60 }}>
                <Spin size="large" tip="Đang tải câu hỏi..." />
              </div>
            ) : questions.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60, color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤔</div>
                <Title level={4} style={{ color: '#6b7280' }}>Chưa có câu hỏi nào</Title>
                <p>Hãy là người đầu tiên đặt câu hỏi!</p>
                <Button type="primary" onClick={handleCreateQuestion}>Đặt câu hỏi ngay</Button>
              </div>
            ) : (
              <List
                itemLayout="vertical"
                size="large"
                dataSource={questions}
                renderItem={(item) => (
                  <Card
                    hoverable
                    style={{
                      marginBottom: 20,
                      borderRadius: '12px',
                      border: '1px solid #f0f0f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                    bodyStyle={{ padding: '20px 24px' }}
                  >
                    <List.Item
                      key={item.id}
                      style={{ padding: 0, border: 'none' }}
                      actions={[
                        <Space style={{ color: '#666' }}><LikeOutlined style={{ color: '#1890ff' }} /> <b>{item.votes}</b> Thích</Space>,
                        <Space style={{ color: '#666' }}><MessageOutlined style={{ color: '#52c41a' }} /> <b>{item.answers}</b> Trả lời</Space>,
                        <Space style={{ color: '#999' }}><ClockCircleOutlined /> {item.time}</Space>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Link to={`/questions/${item.id}`} style={{ fontSize: '20px', fontWeight: 600, color: '#111827', display: 'block', marginBottom: '8px' }}>
                            {item.title}
                          </Link>
                        }
                        description={
                          <Space split={<Text type="secondary" style={{ padding: '0 4px' }}>•</Text>}>
                            <Space style={{ color: '#4b5563', fontWeight: 500 }}>
                              <UserOutlined style={{ color: '#8b5cf6' }} /> {item.author}
                            </Space>
                          </Space>
                        }
                      />
                      <div style={{ margin: '16px 0', color: '#4b5563', fontSize: '15px', lineHeight: '1.6' }}>
                        {item.description?.length > 180 ? `${item.description.substring(0, 180)}...` : item.description}
                      </div>
                      <div style={{ marginTop: '16px' }}>
                        {(item.tags || []).map((tag: string) => (
                          <Tag color="cyan" key={tag} style={{ borderRadius: '16px', padding: '2px 10px', fontSize: '13px', border: 'none', background: '#e0f2fe', color: '#0369a1' }}>
                            #{tag}
                          </Tag>
                        ))}
                      </div>
                    </List.Item>
                  </Card>
                )}
              />
            )}
          </div>
        </Col>

        {/* Cột phải: Sidebar */}
        <Col xs={24} lg={6} style={{ height: '100%', overflowY: 'auto', paddingRight: '8px' }}>
          {user ? (
            <Card style={{
              marginBottom: 24,
              textAlign: 'center',
              borderRadius: '16px',
              background: 'linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(24, 144, 255, 0.1)'
            }}>
              <div style={{
                width: 72, height: 72, background: '#1890ff', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'white', fontSize: 32,
                boxShadow: '0 4px 10px rgba(24, 144, 255, 0.4)'
              }}>
                <UserOutlined />
              </div>
              <Title level={4} style={{ marginBottom: 4, fontWeight: 700 }}>Chào, {user.username}!</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Vai trò: <Tag color="blue" style={{ borderRadius: 12 }}>{user.role}</Tag></Text>
              <Button
                danger
                type="dashed"
                block
                style={{ borderRadius: '8px' }}
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                Đăng xuất
              </Button>
            </Card>
          ) : (
            <Card style={{
              marginBottom: 24,
              textAlign: 'center',
              borderRadius: '16px',
              border: '1px dashed #d9d9d9',
              background: '#fafafa'
            }}>
              <Title level={5} style={{ color: '#1f2937' }}>Chào khách!</Title>
              <p style={{ color: '#6b7280', marginBottom: 16 }}>Tham gia cộng đồng để đặt câu hỏi và thảo luận nhé.</p>
              <Button type="primary" block style={{ borderRadius: '8px', fontWeight: 500 }} onClick={() => navigate('/login')}>
                Đăng nhập ngay
              </Button>
            </Card>
          )}

          <Card title="🏷️ Chủ đề phổ biến" style={{ marginBottom: 24, borderRadius: '16px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <Space wrap size={[0, 8]}>
              {['javascript', 'reactjs', 'nodejs', 'mysql', 'typescript', 'frontend', 'backend', 'api'].map(tag => (
                <Tag
                  color="processing"
                  key={tag}
                  style={{ borderRadius: '16px', cursor: 'pointer', padding: '2px 10px' }}
                  onClick={() => { setSearchValue(''); fetchQuestions('', 'newest'); }}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </Card>

          <Card title="📊 Thống kê" style={{ borderRadius: '16px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#6b7280' }}>📝 Câu hỏi:</Text>
              <Text strong style={{ color: '#111827' }}>{stats.totalQuestions}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#6b7280' }}>👥 Thành viên:</Text>
              <Text strong style={{ color: '#111827' }}>{stats.totalUsers || '--'}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ color: '#6b7280' }}>🟢 Trực tuyến:</Text>
              <Text strong style={{ color: '#52c41a' }}>1</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;