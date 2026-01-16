import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import Tree from 'react-d3-tree';
import userHierarchyService from '../../services/userHierarchyService';

const styles = {
  wrapper: {
    width: '100vw',
    height: '100vh',
    background: '#F8FAFC',
    overflow: 'hidden'
  },

  rootNode: {
    width: 180,
    height: 50,
    fontSize: 20,
    background: '#FFFFFF',
    border: '1.5px solid #000000',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: '#000000'
  },

  node: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: 300,
    padding: '12px 14px',
    background: '#FFFFFF',
    borderRadius: 12,
    border: '1.5px solid #000000',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#E0F2FE',
    border: '1.5px solid #000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: '#000000',
    flexShrink: 0
  },

  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },

  name: {
    fontSize: 16,
    fontWeight: 600,
    color: '#000000'
  },

  role: {
    width: 'fit-content',
    padding: '0px',
    fontSize: 13,
    fontWeight: 600,
    color: '#2563EB',
    // background: '#2563EB',
    // borderRadius: 999,
    textTransform: 'uppercase'
  }
};

const OrganizationTree = () => {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  /* ---------------- Resize ---------------- */
  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------------- Fetch Hierarchy ---------------- */
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const users = await userHierarchyService.getUserHierarchy();

        const map = {};
        users.forEach(u => {
          if (u?.email) map[u.email] = { ...u, children: [] };
        });

        const roots = [];
        users.forEach(u => {
          if (!u?.email) return;
          if (u.created_by && map[u.created_by]) {
            map[u.created_by].children.push(map[u.email]);
          } else {
            roots.push(map[u.email]);
          }
        });

        setTreeData({ name: 'Organization', children: roots });
      } catch {
        setError('Failed to load hierarchy');
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchy();
  }, []);

  /* ---------------- Custom Node (HTML only) ---------------- */
  const renderNode = ({ nodeDatum }) => {
    if (nodeDatum.name === 'Organization') {
      return (
        <g>
          <foreignObject x={-90} y={-25} width={180} height={50}>
            <div className="org-root-node" style={styles.rootNode}>
              Hirepool.AI
            </div>
          </foreignObject>
        </g>
      );
    }

    const initials = `${nodeDatum.first_name?.[0] || ''}${nodeDatum.last_name?.[0] || ''}`;
    const role = nodeDatum.role_name || 'Team Member';

    return (
      <g>
        <foreignObject x={-40} y={-35} width={340} height={90}>
          <div className="org-node" style={styles.node}>
            <div className="org-avatar" style={styles.avatar}>
              {initials}
            </div>

            <div className="org-content" style={styles.content}>
              <div className="org-name" style={styles.name}>
                {nodeDatum.first_name} {nodeDatum.last_name}
              </div>

              <span className="org-role" style={styles.role}>
                {role}
              </span>
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  if (loading)
    return (
      <Box sx={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );

  const translate = {
    x: dimensions.width / 2,
    y: 100
  };

  const zoom =
    dimensions.width < 768 ? 0.6 :
    dimensions.width < 1024 ? 0.7 :
    0.85;

  return (
    <Box style={styles.wrapper}>
      <Tree
        data={treeData}
        orientation="vertical"
        renderCustomNodeElement={renderNode}
        pathFunc="step"
        translate={translate}
        zoom={zoom}
        zoomable={false}
        draggable={false}
        collapsible={false}
        separation={{ siblings: 2.5, nonSiblings: 3 }}
        styles={{
          links: {
            stroke: '#CBD5E1',
            strokeWidth: 2
          }
        }}
      />
    </Box>
  );
};

export default OrganizationTree;
