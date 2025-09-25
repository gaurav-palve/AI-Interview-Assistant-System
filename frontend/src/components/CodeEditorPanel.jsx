import { useState, useEffect } from "react";
import { 
  Box, 
  Flex, 
  Select, 
  HStack, 
  Text,
  Button,
  useToast,
  useColorModeValue
} from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { LANGUAGE_VERSIONS, CODE_SNIPPETS } from "../constants";

const CodeEditorPanel = ({ 
  language, 
  code, 
  onCodeChange, 
  onLanguageChange, 
  onEditorDidMount,
  question
}) => {
  const [editorLanguage, setEditorLanguage] = useState(language);
  const [editorCode, setEditorCode] = useState(code);
  const [editor, setEditor] = useState(null);
  const toast = useToast();
  
  // Background colors
  const bgColor = useColorModeValue("white", "gray.800");
  const headerBgColor = useColorModeValue("gray.50", "gray.700");
  
  // Update editor language when language prop changes
  useEffect(() => {
    setEditorLanguage(language);
  }, [language]);
  
  // Update editor code when code prop changes
  useEffect(() => {
    if (editor && code !== editorCode) {
      // Use setValue instead of directly setting state to ensure editor is updated
      editor.setValue(code);
      setEditorCode(code);
    }
  }, [code, editor]);
  
  // Handle language change
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setEditorLanguage(newLanguage);
    onLanguageChange(newLanguage);
    
    toast({
      title: "Language changed",
      description: `Switched to ${newLanguage}`,
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Handle code change
  const handleCodeChange = (value) => {
    setEditorCode(value);
    onCodeChange(value);
  };
  
  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    setEditor(editor);
    
    // Focus the editor
    setTimeout(() => {
      editor.focus();
      
      // Set cursor at the end of the code
      const model = editor.getModel();
      const lastLineNumber = model.getLineCount();
      const lastLineLength = model.getLineLength(lastLineNumber);
      editor.setPosition({ lineNumber: lastLineNumber, column: lastLineLength });
    }, 100);
    
    if (onEditorDidMount) {
      onEditorDidMount(editor);
    }
  };
  
  // Format code
  const formatCode = () => {
    if (editor) {
      editor.getAction('editor.action.formatDocument').run();
      toast({
        title: "Code formatted",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };
  
  // Reset code
  const resetCode = () => {
    if (question) {
      const template = question.solutionTemplates?.[editorLanguage] || 
                       question.solutionTemplate || 
                       CODE_SNIPPETS[editorLanguage];
      
      if (editor) {
        editor.setValue(template);
      }
      
      setEditorCode(template);
      onCodeChange(template);
    } else if (CODE_SNIPPETS[editorLanguage]) {
      const template = CODE_SNIPPETS[editorLanguage];
      
      if (editor) {
        editor.setValue(template);
      }
      
      setEditorCode(template);
      onCodeChange(template);
    }
    
    toast({
      title: "Code reset",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Get the appropriate Monaco language
  const getMonacoLanguage = (lang) => {
    const langMap = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'python': 'python',
      'java': 'java',
      'csharp': 'csharp',
      'php': 'php'
    };
    
    return langMap[lang.toLowerCase()] || 'javascript';
  };
  
  return (
    <Box height="100%" display="flex" flexDirection="column">
      {/* Editor header with language selector */}
      <Flex 
        p={2} 
        bg={headerBgColor} 
        justifyContent="space-between" 
        alignItems="center"
        borderBottomWidth="1px"
        borderBottomColor="gray.200"
      >
        <HStack>
          <Text fontSize="sm">Language:</Text>
          <Select 
            size="sm" 
            value={editorLanguage} 
            onChange={handleLanguageChange}
            width="150px"
          >
            {Object.keys(LANGUAGE_VERSIONS).map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)} ({LANGUAGE_VERSIONS[lang]})
              </option>
            ))}
          </Select>
        </HStack>
        
        <HStack>
          <Button
            size="sm"
            variant="solid"
            colorScheme="blue"
            onClick={formatCode}
            boxShadow="sm"
            _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
            borderWidth="1px"
            borderColor="blue.400"
          >
            Format Code
          </Button>
          <Button
            size="sm"
            variant="solid"
            colorScheme="gray"
            onClick={resetCode}
            boxShadow="sm"
            _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
            borderWidth="1px"
            borderColor="gray.400"
          >
            Reset
          </Button>
        </HStack>
      </Flex>
      
      {/* Monaco Editor */}
      <Box flex="1" overflow="hidden">
        <Editor
          height="100%"
          language={getMonacoLanguage(editorLanguage)}
          defaultValue={editorCode}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: "on",
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            formatOnPaste: true,
            formatOnType: true,
            readOnly: false, // Ensure editor is not read-only
            fixedOverflowWidgets: true
          }}
        />
      </Box>
    </Box>
  );
};

export default CodeEditorPanel;