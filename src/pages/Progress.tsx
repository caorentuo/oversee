import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Task {
  id: number;
  name: string;
  delivery_date: string;
  status: string;
  created_at: string;
}

interface PersonProgress {
  user_id: number;
  username: string;
  name: string;
  tasks: Task[];
}

interface ProjectProgress {
  task_id: number;
  task_name: string;
  status: string;
  delivery_date: string;
  participants: { id: number; username: string; name: string }[];
}

export default function Progress() {
  const [viewMode, setViewMode] = useState<'person' | 'project'>('person');
  const [personData, setPersonData] = useState<PersonProgress[]>([]);
  const [projectData, setProjectData] = useState<ProjectProgress[]>([]);
  
  // Date range for Gantt chart
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 30));

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    try {
      if (viewMode === 'person') {
        const res = await api.get('/api/progress/person');
        // Filter out admin or users without tasks if needed, but we'll show all
        setPersonData(res.data.filter((p: PersonProgress) => p.username !== 'admin'));
        
        // Calculate date range based on tasks
        let minDate = new Date();
        let maxDate = addDays(new Date(), 30);
        
        res.data.forEach((person: PersonProgress) => {
          person.tasks.forEach((task) => {
            const start = parseISO(task.created_at);
            const end = parseISO(task.delivery_date);
            if (start < minDate) minDate = start;
            if (end > maxDate) maxDate = end;
          });
        });
        
        setStartDate(addDays(minDate, -2));
        setEndDate(addDays(maxDate, 5));
        
      } else {
        const res = await api.get('/api/progress/project');
        setProjectData(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTaskColor = (taskId: number) => {
    // Generate a consistent color based on task ID
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 
      'bg-teal-500', 'bg-cyan-500', 'bg-emerald-500'
    ];
    return colors[taskId % colors.length];
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case '进行中': return 'border-yellow-400 ring-2 ring-yellow-400';
      case '已完成': return 'border-green-400 ring-2 ring-green-400';
      case '已延期': return 'border-red-400 ring-2 ring-red-400';
      default: return 'border-gray-300 ring-1 ring-gray-300';
    }
  };

  const renderGanttChart = () => {
    const totalDays = differenceInDays(endDate, startDate);
    const days = Array.from({ length: totalDays + 1 }).map((_, i) => addDays(startDate, i));

    return (
      <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex border-b border-gray-200 pb-2 mb-4">
            <div className="w-32 flex-shrink-0 font-semibold text-gray-700">人员</div>
            <div className="flex-1 flex relative">
              {days.map((day, i) => (
                <div key={i} className="flex-1 text-center text-xs text-gray-500 border-l border-gray-100">
                  {format(day, 'MM-dd')}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-6">
            {personData.map((person) => (
              <div key={person.user_id} className="flex relative items-center border-b border-gray-50 pb-4">
                <div className="w-32 flex-shrink-0 font-medium text-gray-800">{person.name || person.username}</div>
                <div className="flex-1 relative h-12">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {days.map((_, i) => (
                      <div key={i} className="flex-1 border-l border-gray-100 h-full"></div>
                    ))}
                  </div>
                  
                  {/* Task Bars */}
                  {person.tasks.map((task, idx) => {
                    const taskStart = parseISO(task.created_at);
                    const taskEnd = parseISO(task.delivery_date);
                    
                    const startOffset = Math.max(0, differenceInDays(taskStart, startDate));
                    const duration = Math.max(1, differenceInDays(taskEnd, taskStart));
                    
                    const leftPercent = (startOffset / totalDays) * 100;
                    const widthPercent = (duration / totalDays) * 100;
                    
                    return (
                      <div
                        key={task.id}
                        className={`absolute h-6 rounded-md shadow-sm flex items-center px-2 text-xs text-white truncate cursor-pointer hover:opacity-90 ${getTaskColor(task.id)} ${getStatusBorderColor(task.status)}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          top: `${(idx % 2) * 28}px`, // Stagger overlapping tasks slightly
                          zIndex: 10
                        }}
                        title={`${task.name} (${task.status})`}
                      >
                        {task.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {personData.length === 0 && (
              <div className="text-center py-8 text-gray-500">暂无人员任务数据</div>
            )}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-8 flex flex-col space-y-4 items-center justify-center text-sm">
          <div className="text-gray-500 text-xs">色块代表不同任务，边框颜色代表任务状态：</div>
          <div className="flex space-x-6">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full border-gray-300 ring-1 ring-gray-300 mr-2 bg-gray-100"></span>待开始</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full border-yellow-400 ring-2 ring-yellow-400 mr-2 bg-yellow-100"></span>进行中</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full border-green-400 ring-2 ring-green-400 mr-2 bg-green-100"></span>已完成</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full border-red-400 ring-2 ring-red-400 mr-2 bg-red-100"></span>已延期</div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectData.map((project) => (
          <div key={project.task_id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{project.task_name}</h3>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                project.status === '已完成' ? 'bg-green-100 text-green-800' :
                project.status === '进行中' ? 'bg-yellow-100 text-yellow-800' :
                project.status === '已延期' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              交付日期: <span className="font-medium text-gray-800">{project.delivery_date}</span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">参与人员 ({project.participants.length})</h4>
              <div className="flex flex-wrap gap-2">
                {project.participants.map(p => (
                  <span key={p.id} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                    {p.name || p.username}
                  </span>
                ))}
                {project.participants.length === 0 && (
                  <span className="text-sm text-gray-500">暂无人员</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {projectData.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow text-gray-500">
            暂无项目数据
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">进度查看</h2>
        
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('person')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'person' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            人员维度
          </button>
          <button
            onClick={() => setViewMode('project')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'project' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            项目维度
          </button>
        </div>
      </div>

      {viewMode === 'person' ? renderGanttChart() : renderProjectView()}
    </div>
  );
}
