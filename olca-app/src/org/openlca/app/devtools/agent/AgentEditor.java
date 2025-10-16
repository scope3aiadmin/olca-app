package org.openlca.app.devtools.agent;

import java.io.File;
import java.util.UUID;

import org.eclipse.jface.dialogs.ProgressMonitorDialog;
import org.eclipse.swt.SWT;
import org.eclipse.swt.browser.Browser;
import org.eclipse.swt.layout.FillLayout;
import org.eclipse.ui.forms.IManagedForm;
import org.eclipse.ui.forms.editor.FormPage;
import org.openlca.app.App;
import org.openlca.app.M;
import org.openlca.app.devtools.ScriptingEditor;
import org.openlca.app.editors.Editors;
import org.openlca.app.editors.SimpleEditorInput;
import org.openlca.app.logging.Console;
import org.openlca.app.preferences.Theme;
import org.openlca.app.rcp.HtmlFolder;
import org.openlca.app.rcp.images.Icon;
import org.openlca.app.navigation.Navigator;
import org.openlca.app.util.ErrorReporter;
import org.openlca.app.util.UI;
import org.openlca.util.Strings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class AgentEditor extends ScriptingEditor {

	private final Logger log = LoggerFactory.getLogger(getClass());
	private Page page;

	public static void open() {
		var id = UUID.randomUUID() + "_new";
		var input = new SimpleEditorInput(id, "Agent");
		Editors.open(input, "AgentEditor");
	}

	public static void open(File file) {
		if (file == null || !file.exists())
			return;
		var id = file.getAbsolutePath();
		var input = new SimpleEditorInput(id, "Agent");
		Editors.open(input, "AgentEditor");
	}

	@Override
	public void eval() {
		// For the agent, we don't have a traditional "eval" like Python
		// Instead, we could trigger a chat action or refresh the interface
		Console.show();
		App.run("Agent Action", () -> {
			// This could trigger specific agent actions
			// For now, just log that the action was triggered
			System.out.println("Agent action triggered");
		});
	}

	@Override
	protected FormPage getPage() {
		setTitleImage(Icon.MAP.get()); // Using Python icon for now, could create a custom agent icon
		return page = new Page();
	}

	private class Page extends FormPage {

		private Browser browser;

		public Page() {
			super(AgentEditor.this, "AgentEditorPage", "Agent");
		}

		@Override
		protected void createFormContent(IManagedForm mForm) {
			var form = UI.header(mForm, getTitle(), Icon.MAP.get());
			var tk = mForm.getToolkit();
			var body = UI.body(form, tk);
			body.setLayout(new FillLayout());
			try {
				browser = new Browser(body, SWT.NONE);
				browser.setJavascriptEnabled(true);

				// initialize the agent interface
				UI.onLoaded(browser, HtmlFolder.getUrl("agent.html"), () -> {

					browser.getDisplay();
					// set the theme - default to dark mode
					if (Theme.isDark()) {
						browser.execute("window.setTheme(true)");
					} else {
						browser.execute("window.setTheme(true)"); // Default to dark mode
					}

					// add the _onRefreshNavigator listener for tool call completion
					UI.bindFunction(browser, "_onRefreshNavigator", (args) -> {
						// Simply refresh the navigator when called from HTML
						log.info("Refreshed navigator");
						Navigator.refresh();
						return null;
					});
				});

			} catch (Exception e) {
				ErrorReporter.on("failed to create browser in Agent editor", e);
			}
		}
	}
}
