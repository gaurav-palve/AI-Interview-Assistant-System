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
    fontSize: 13,
    fontWeight: 600,
    color: '#2563EB',
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

  /* ---------------- Handle Resize ---------------- */
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------------- Fetch Hierarchy (NO rebuilding) ---------------- */
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const hierarchy = await userHierarchyService.getUserHierarchy();

        setTreeData({
          name: 'Organization',
          children: hierarchy
        });
      } catch (err) {
        setError('Failed to load organization hierarchy');
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchy();
  }, []);

  /* ---------------- Custom Node Renderer ---------------- */
  const renderNode = ({ nodeDatum }) => {
    // Root Node
    if (nodeDatum.name === 'Organization') {
      return (
        <g>
          <foreignObject x={-90} y={-25} width={180} height={50}>
            <div style={styles.rootNode}>
              RecruitIQ
            </div>
          </foreignObject>
        </g>
      );
    }

    const initials = `${nodeDatum.first_name?.[0] || ''}${nodeDatum.last_name?.[0] || ''}`;
    const role = nodeDatum.role_name || 'TEAM MEMBER';

    return (
      <g>
        <foreignObject x={-40} y={-35} width={340} height={90}>
          <div style={styles.node}>
            <div style={styles.avatar}>
              {initials}
            </div>

            <div style={styles.content}>
              <div style={styles.name}>
                {nodeDatum.first_name} {nodeDatum.last_name}
              </div>

              <span style={styles.role}>
                {role}
              </span>
            </div>
          </div>
        </foreignObject>
      </g>
    );
  };

  /* ---------------- Loading / Error ---------------- */
  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  /* ---------------- Tree Config ---------------- */
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
